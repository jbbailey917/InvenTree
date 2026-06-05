"""Admin registration for location hours models."""

from django.contrib import admin

from .models import LocationHours, WebhookEndpoint, WebhookLog


@admin.register(LocationHours)
class LocationHoursAdmin(admin.ModelAdmin):
    """Admin for LocationHours."""

    list_display = ['location', 'day', 'open_time', 'close_time']
    list_filter = ['location', 'day']


@admin.register(WebhookEndpoint)
class WebhookEndpointAdmin(admin.ModelAdmin):
    """Admin for WebhookEndpoint."""

    list_display = ['name', 'event_type', 'trigger', 'active']
    list_filter = ['event_type', 'trigger', 'active']


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    """Admin for WebhookLog (read-only audit trail)."""

    list_display = ['webhook', 'event_type', 'location', 'response_code', 'created_at']
    list_filter = ['webhook', 'event_type', 'response_code']
    readonly_fields = [
        'webhook',
        'location',
        'event_type',
        'request_url',
        'request_body',
        'response_code',
        'response_body',
        'created_at',
    ]
