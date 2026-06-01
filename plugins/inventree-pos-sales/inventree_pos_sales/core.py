"""POS Sales Plugin — core entry point."""

from django.utils.translation import gettext_lazy as _

from plugin import InvenTreePlugin
from plugin.mixins import SettingsMixin, UrlsMixin, UserInterfaceMixin


class PosSalesPlugin(SettingsMixin, UrlsMixin, UserInterfaceMixin, InvenTreePlugin):
    """Plugin that automates sales order workflow from POS webhook events."""

    NAME = 'POS Sales'
    SLUG = 'pos-sales'
    TITLE = 'POS Sales Automation'
    DESCRIPTION = (
        'Receives POS webhook events and orchestrates the full sales order workflow'
    )
    VERSION = '0.1.0'

    SETTINGS = {
        'RECEIPT_API_ENDPOINT': {
            'name': _('Receipt API Endpoint'),
            'description': _('External POS API URL that returns receipt line items'),
            'required': True,
        },
        'RECEIPT_API_KEY': {
            'name': _('Receipt API Key'),
            'description': _(
                'Bearer token for authenticating with the POS receipt API'
            ),
            'protected': True,
        },
        'SERVICE_USERNAME': {
            'name': _('Service User'),
            'description': _(
                'InvenTree user account used to create orders (defaults to admin)'
            ),
            'default': 'admin',
        },
    }

    def setup_urls(self):
        """Register the POS webhook endpoint."""
        from django.urls import path

        from .pos_webhook import PosSalesWebhook

        return [path('pos-webhook/', PosSalesWebhook.as_view(), name='pos-webhook')]

    def get_ui_navigation_items(self, request, context, **kwargs):
        """Provide a navigation item for the POS sales page."""
        return [
            {
                'key': 'pos-sales-nav',
                'title': 'POS Sales',
                'icon': 'ti:receipt:outline',
                'options': {'url': '/web/plugin/pos-sales/'},
                'source': self.plugin_static_file('pos_dashboard.js:renderPage'),
            }
        ]

    def get_ui_dashboard_items(self, request, context, **kwargs):
        """Dashboard item showing POS webhook status."""
        settings = (
            self.get_settings_dict() if hasattr(self, 'get_settings_dict') else {}
        )
        return [
            {
                'key': 'pos-sales-dashboard',
                'title': 'POS Sales',
                'description': 'POS webhook integration status',
                'source': self.plugin_static_file(
                    'pos_dashboard.js:renderPosDashboard'
                ),
                'options': {'width': 2, 'height': 2},
                'context': {
                    'endpoint_configured': bool(settings.get('RECEIPT_API_ENDPOINT')),
                    'service_user': settings.get('SERVICE_USERNAME', 'admin'),
                    'webhook_url': '/plugin/pos-sales/pos-webhook/',
                },
            }
        ]
