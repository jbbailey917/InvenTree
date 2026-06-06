"""Admin registration for location hours models."""

from django.contrib import admin

from .models import (
    GoogleOAuthToken,
    LocationApiKey,
    LocationHours,
    WebhookEndpoint,
    WebhookLog,
)

# Unregister first to handle plugin reloads without crashing
_models = [LocationHours, LocationApiKey, WebhookEndpoint, WebhookLog, GoogleOAuthToken]
for _model in _models:
    try:
        admin.site.unregister(_model)
    except admin.sites.NotRegistered:
        pass


@admin.register(LocationHours)
class LocationHoursAdmin(admin.ModelAdmin):
    """Admin for LocationHours."""

    list_display = ['location', 'day', 'open_time', 'close_time']
    list_filter = ['location', 'day']


@admin.register(LocationApiKey)
class LocationApiKeyAdmin(admin.ModelAdmin):
    """Admin for LocationApiKey."""

    list_display = ['name', 'description', 'created', 'updated']
    search_fields = ['name', 'description']
    readonly_fields = ['api_key', 'created', 'updated']


@admin.register(WebhookEndpoint)
class WebhookEndpointAdmin(admin.ModelAdmin):
    """Admin for WebhookEndpoint."""

    list_display = ['name', 'api_key_ref', 'event_type', 'trigger', 'active']
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


@admin.register(GoogleOAuthToken)
class GoogleOAuthTokenAdmin(admin.ModelAdmin):
    """Admin for GoogleOAuthToken."""

    list_display = ['google_email', 'expires_at', 'created', 'updated']
    readonly_fields = ['access_token', 'refresh_token', 'created', 'updated']
