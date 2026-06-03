"""Location Hours Plugin — core entry point."""

from django.utils.translation import gettext_lazy as _

import structlog

from plugin import InvenTreePlugin
from plugin.mixins import AppMixin, SettingsMixin, UrlsMixin, UserInterfaceMixin

logger = structlog.get_logger('inventree')


class LocationHoursPlugin(
    AppMixin, SettingsMixin, UrlsMixin, UserInterfaceMixin, InvenTreePlugin
):
    """Manage operating hours for stock locations and push updates to external webhooks."""

    NAME = 'Location Hours'
    SLUG = 'location-hours'
    TITLE = 'Location Hours Manager'
    DESCRIPTION = (
        'Track operating hours per location and push updates to external webhooks'
    )
    VERSION = '0.1.0'

    SETTINGS = {
        'GOOGLE_ACCOUNT_ID': {
            'name': _('Google Account ID'),
            'description': _('Google Business account ID (e.g. accounts/123)'),
            'default': '',
        },
        'DEFAULT_TIMEZONE': {
            'name': _('Default Timezone'),
            'description': _('IANA timezone for location hours (e.g. America/Chicago)'),
            'default': 'America/Chicago',
        },
    }

    def setup_urls(self):
        """Return URL patterns for the location hours plugin."""
        from django.urls import path

        from .api import (
            LocationHoursBulkUpdate,
            LocationHoursDetail,
            LocationHoursListCreate,
            LocationHoursOverview,
            PushHoursView,
            WebhookEndpointDetail,
            WebhookEndpointListCreate,
            WebhookLogList,
        )

        return [
            path('hours/', LocationHoursListCreate.as_view(), name='hours-list'),
            path('hours/<int:pk>/', LocationHoursDetail.as_view(), name='hours-detail'),
            path('hours/bulk/', LocationHoursBulkUpdate.as_view(), name='hours-bulk'),
            path(
                'hours/overview/',
                LocationHoursOverview.as_view(),
                name='hours-overview',
            ),
            path('push/<int:location_pk>/', PushHoursView.as_view(), name='hours-push'),
            path(
                'endpoints/', WebhookEndpointListCreate.as_view(), name='endpoint-list'
            ),
            path(
                'endpoints/<int:pk>/',
                WebhookEndpointDetail.as_view(),
                name='endpoint-detail',
            ),
            path('logs/', WebhookLogList.as_view(), name='log-list'),
        ]

    def get_ui_navigation_items(self, request, context, **kwargs):
        """Return a navigation tab for the bulk hours overview."""
        return [
            {
                'key': 'location-hours-nav',
                'title': 'Location Hours',
                'icon': 'ti:clock:outline',
                'options': {'url': '/web/plugin/location-hours/overview/'},
                'source': self.plugin_static_file('bulk_editor.js')
                + '?v='
                + self.VERSION
                + ':renderPage',
            }
        ]

    def get_ui_panels(self, request, context, **kwargs):
        """Return a panel for the StockLocation detail page."""
        target_model = context.get('target_model', None)
        target_id = context.get('target_id', None)
        if target_model == 'stocklocation' and target_id:
            return [
                {
                    'key': 'location-hours-panel',
                    'title': _('Location Hours'),
                    'source': self.plugin_static_file('hours_panel.js:renderPanel'),
                    'icon': 'ti:clock:outline',
                    'context': {
                        'location_id': target_id,
                        'timezone': self.get_setting(
                            'DEFAULT_TIMEZONE', backup_value='America/Chicago'
                        ),
                        'google_account_id': self.get_setting(
                            'GOOGLE_ACCOUNT_ID', backup_value=''
                        ),
                    },
                }
            ]
        return []
