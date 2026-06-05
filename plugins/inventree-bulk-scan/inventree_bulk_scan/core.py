"""Bulk Scan Plugin — core entry point."""

from django.utils.translation import gettext_lazy as _

from plugin import InvenTreePlugin
from plugin.mixins import SettingsMixin, UrlsMixin, UserInterfaceMixin


class BulkScanPlugin(SettingsMixin, UrlsMixin, UserInterfaceMixin, InvenTreePlugin):
    """Plugin providing bulk barcode scanning workflows."""

    NAME = 'Bulk Scan'
    SLUG = 'bulk-scan'
    TITLE = 'Bulk Barcode Scanning'
    DESCRIPTION = (
        'Bulk barcode scanning workflow with move, receive, and consolidate actions'
    )
    VERSION = '0.1.0'

    SETTINGS = {
        'FISCAL_YEAR_START': {
            'name': _('Fiscal Year Start'),
            'description': _(
                'Month and day that the fiscal year begins (MM-DD format)'
            ),
            'default': '01-01',
            'validator': str,
        }
    }

    def setup_urls(self):
        """Return URL patterns for the bulk scan plugin API endpoints."""
        from django.urls import path

        from .api import PricingDashboardData

        return [path('api/pricing/', PricingDashboardData.as_view(), name='pricing')]

    def get_ui_navigation_items(self, request, context, **kwargs):
        """Return navigation items for the main sidebar."""
        return [
            {
                'key': 'bulk-scan-nav',
                'title': 'Bulk Scan',
                'icon': 'ti:qr-code:outline',
                'options': {'url': '/web/plugin/bulk-scan/'},
                'source': self.plugin_static_file('bulk_scan_page.js')
                + '?v='
                + self.VERSION
                + ':renderPage',
            }
        ]

    def get_ui_dashboard_items(self, request, context, **kwargs):
        """Return dashboard items for the main dashboard view."""
        return [
            {
                'key': 'pricing-dashboard',
                'title': _('Part Pricing Overview'),
                'description': _('Markup percentages, retail value, and stock costs'),
                'source': self.plugin_static_file('pricing_dashboard.js'),
                'options': {'width': 4, 'height': 2},
            }
        ]
