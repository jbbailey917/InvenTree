"""Dimension Templates Plugin — sets up part parameter templates with auto-calc."""

from django.utils.translation import gettext_lazy as _

import structlog

from plugin import InvenTreePlugin
from plugin.mixins import SettingsMixin

logger = structlog.get_logger('inventree')

LWH_NAMES = {'Length', 'Width', 'Height'}
VOLUME_NAME = 'Volume'

# Global flag to ensure signal is only connected once
_signal_connected = False


def _connect_volume_signal():
    """Connect the auto-calc signal for L/W/H → Volume. Idempotent."""
    global _signal_connected
    if _signal_connected:
        return

    from common.models import Parameter

    def _auto_calc(sender, instance, created, **kwargs):
        from common.models import Parameter as Param
        from common.models import ParameterTemplate

        try:
            template = instance.template
        except ParameterTemplate.DoesNotExist:
            return

        if template.name not in LWH_NAMES:
            return

        # Handle both ContentType object and plain string
        ct = instance.model_type
        if hasattr(ct, 'model') and ct.model != 'part':
            return

        model_id = instance.model_id

        # Fetch the three L/W/H templates
        templates = {
            t.name: t for t in ParameterTemplate.objects.filter(name__in=LWH_NAMES)
        }
        if len(templates) < 3:
            return

        # Fetch existing L/W/H parameters for this part
        params = {
            p.template.name: p
            for p in Param.objects.filter(
                model_type=ct, model_id=model_id, template__in=templates.values()
            )
        }

        # All three must have numeric values
        values = {}
        for name in LWH_NAMES:
            p = params.get(name)
            if p and p.data_numeric is not None:
                values[name] = p.data_numeric
            else:
                return

        volume = values['Length'] * values['Width'] * values['Height']

        vol_template = (
            templates.get(VOLUME_NAME)
            or ParameterTemplate.objects.filter(name=VOLUME_NAME).first()
        )
        if not vol_template:
            return

        vol_param = Param.objects.filter(
            model_type=ct, model_id=model_id, template=vol_template
        ).first()

        if vol_param is None:
            Param.objects.create(
                model_type=ct,
                model_id=model_id,
                template=vol_template,
                data=str(volume),
                data_numeric=volume,
            )
        elif vol_param.data_numeric != volume:
            vol_param.data = str(volume)
            vol_param.data_numeric = volume
            vol_param.save()

    from django.db.models.signals import post_save

    post_save.connect(
        _auto_calc, sender=Parameter, dispatch_uid='dimension_volume_auto_calc'
    )
    _signal_connected = True
    logger.info('Connected volume auto-calc signal')


class DimensionTemplatesPlugin(SettingsMixin, InvenTreePlugin):
    """Creates Length/Width/Height/Volume parameter templates and assigns them to a configurable Part Category.

    Auto-calculates Volume from L x W x H via a Django signal.
    Uses InvenTree's native parameter system — no custom models or UI.
    Once native dimension support lands, just deactivate this plugin.
    """

    NAME = 'Dimension Templates'
    SLUG = 'dimension-templates'
    TITLE = 'Part Dimension Templates'
    DESCRIPTION = 'Adds Length/Width/Height/Volume parameter templates with auto-calc'
    VERSION = '0.1.0'

    SETTINGS = {
        'DIMENSIONS_CATEGORY': {
            'name': _('Part Category'),
            'description': _('Category to assign dimension parameter templates to'),
            'model': 'part.partcategory',
            'required': False,
        }
    }

    DIMENSION_TEMPLATES = [
        {'name': 'Length', 'units': 'm'},
        {'name': 'Width', 'units': 'm'},
        {'name': 'Height', 'units': 'm'},
        {'name': 'Volume', 'units': 'm³'},
    ]

    _templates_ensured = False

    def _ensure_dimension_templates(self):
        """Create templates and assign to the configured category.

        Idempotent — safe to call repeatedly.
        """
        from common.models import ParameterTemplate
        from part.models import PartCategory

        category_pk = self.get_setting('DIMENSIONS_CATEGORY', backup_value=None)
        category = None
        if category_pk:
            try:
                category = PartCategory.objects.get(pk=category_pk)
            except PartCategory.DoesNotExist:
                logger.warning('Category pk=%s not found', category_pk)

        for tmpl in self.DIMENSION_TEMPLATES:
            obj, created = ParameterTemplate.objects.get_or_create(
                name=tmpl['name'], defaults={'units': tmpl['units']}
            )
            if created:
                logger.info('Created parameter template: %s', tmpl['name'])

            if category and not category.parameter_templates.filter(pk=obj.pk).exists():
                category.parameter_templates.add(obj)
                logger.info('Assigned %s to category %s', tmpl['name'], category.name)

    def _ensure_templates_if_needed(self):
        """Lazily ensure dimension parameter templates exist."""
        if self._templates_ensured:
            return
        try:
            self._ensure_dimension_templates()
            _connect_volume_signal()
            self._templates_ensured = True
        except Exception as exc:
            logger.warning('Dimension template setup deferred: %s', exc)

    def __init__(self, *args, **kwargs):
        """Initialize and attempt template setup."""
        super().__init__(*args, **kwargs)
        self._ensure_templates_if_needed()
