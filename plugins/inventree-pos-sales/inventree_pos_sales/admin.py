"""Admin configuration for the POS Sales plugin."""

from django.contrib import admin

from .models import PosApiKey, POSTerminal


@admin.register(POSTerminal)
class POSTerminalAdmin(admin.ModelAdmin):
    """Admin interface for POSTerminal."""

    list_display = ['name', 'terminal_id', 'location', 'customer', 'active']
    list_filter = ['active']
    search_fields = ['name', 'terminal_id']
    readonly_fields = ['receipt_api_key']


@admin.register(PosApiKey)
class PosApiKeyAdmin(admin.ModelAdmin):
    """Admin interface for PosApiKey."""

    list_display = ['name', 'description', 'created', 'updated']
    search_fields = ['name', 'description']
    readonly_fields = ['api_key', 'created', 'updated']
