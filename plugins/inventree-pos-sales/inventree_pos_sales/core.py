"""POS Sales Plugin — core entry point."""

from plugin import InvenTreePlugin
from plugin.mixins import AppMixin, SettingsMixin, UrlsMixin, UserInterfaceMixin


class PosSalesPlugin(
    AppMixin, SettingsMixin, UrlsMixin, UserInterfaceMixin, InvenTreePlugin
):
    """Plugin that automates sales order workflow from POS webhook events."""

    NAME = 'POS Sales'
    SLUG = 'pos-sales'
    TITLE = 'POS Sales Automation'
    DESCRIPTION = (
        'Receives POS webhook events and orchestrates the full sales order workflow'
    )
    VERSION = '0.1.0'

    def setup_urls(self):
        """Register the POS webhook and terminal API endpoints."""
        from django.urls import path

        from .pos_webhook import PosSalesWebhook
        from .terminals import (
            ApiKeyDetail,
            ApiKeyListCreate,
            TerminalDetail,
            TerminalListCreate,
        )

        return [
            path('pos-webhook/', PosSalesWebhook.as_view(), name='pos-webhook'),
            path('terminals/', TerminalListCreate.as_view(), name='terminal-list'),
            path(
                'terminals/<int:pk>/', TerminalDetail.as_view(), name='terminal-detail'
            ),
            path('api-keys/', ApiKeyListCreate.as_view(), name='api-key-list'),
            path('api-keys/<int:pk>/', ApiKeyDetail.as_view(), name='api-key-detail'),
        ]

    def get_ui_navigation_items(self, request, context, **kwargs):
        """Provide a navigation item for the POS sales page."""
        return [
            {
                'key': 'pos-sales-nav',
                'title': 'POS Sales',
                'icon': 'ti:receipt:outline',
                'options': {'url': '/web/plugin/pos-sales/'},
                'source': self.plugin_static_file('pos_dashboard.js')
                + '?v='
                + self.VERSION
                + ':renderPage',
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
