"""Models for the location hours plugin."""

from django.db import models
from django.utils.translation import gettext_lazy as _

import stock.models


class LocationHours(models.Model):
    """Operating hours for a stock location, per day of week."""

    class DayOfWeek(models.IntegerChoices):
        """Days of the week."""

        MONDAY = 0, _('Monday')
        TUESDAY = 1, _('Tuesday')
        WEDNESDAY = 2, _('Wednesday')
        THURSDAY = 3, _('Thursday')
        FRIDAY = 4, _('Friday')
        SATURDAY = 5, _('Saturday')
        SUNDAY = 6, _('Sunday')

    location = models.ForeignKey(
        stock.models.StockLocation,
        on_delete=models.CASCADE,
        related_name='location_hours',
        verbose_name=_('Location'),
    )
    day = models.PositiveSmallIntegerField(
        choices=DayOfWeek.choices, verbose_name=_('Day of Week')
    )
    open_time = models.TimeField(
        null=True,
        blank=True,
        verbose_name=_('Open Time'),
        help_text=_('Leave blank if closed on this day'),
    )
    close_time = models.TimeField(null=True, blank=True, verbose_name=_('Close Time'))

    class Meta:
        """Meta options for LocationHours."""

        app_label = 'inventree_location_hours'
        verbose_name = _('Location Hours')
        verbose_name_plural = _('Location Hours')
        unique_together = [('location', 'day')]
        ordering = ['location', 'day']

    def __str__(self):
        """String representation."""
        day_name = self.get_day_display()
        if self.open_time and self.close_time:
            return (
                f'{self.location.name} {day_name}: {self.open_time} - {self.close_time}'
            )
        return f'{self.location.name} {day_name}: Closed'

    @property
    def is_closed(self):
        """Return True if the location is closed on this day."""
        return self.open_time is None or self.close_time is None


class LocationApiKey(models.Model):
    """A named API key stored encrypted for reuse across webhook endpoints."""

    name = models.CharField(
        max_length=200,
        unique=True,
        verbose_name=_('Name'),
        help_text=_('Human-readable name for this key'),
    )
    description = models.CharField(
        max_length=500, blank=True, verbose_name=_('Description')
    )
    api_key = models.TextField(
        blank=True, verbose_name=_('API Key'), help_text=_('Encrypted at rest.')
    )
    created = models.DateTimeField(auto_now_add=True, verbose_name=_('Created'))
    updated = models.DateTimeField(auto_now=True, verbose_name=_('Updated'))

    class Meta:
        """Meta options."""

        app_label = 'inventree_location_hours'
        verbose_name = _('Location API Key')
        verbose_name_plural = _('Location API Keys')
        ordering = ['name']

    def __str__(self):
        """String representation."""
        return self.name

    def set_key(self, plaintext):
        """Encrypt and store an API key."""
        if not plaintext:
            self.api_key = ''
            return
        from .crypto import encrypt

        self.api_key = encrypt(plaintext)

    def get_key(self):
        """Decrypt and return the stored API key."""
        if not self.api_key:
            return ''
        from .crypto import decrypt

        return decrypt(self.api_key)


class WebhookEndpoint(models.Model):
    """Configurable webhook destination."""

    class TriggerType(models.TextChoices):
        """Webhook trigger types."""

        MANUAL = 'manual', _('Manual Only')
        ON_SAVE = 'on_save', _('On Save')

    class EventType(models.TextChoices):
        """Webhook event types."""

        HOURS_UPDATED = 'hours_updated', _('Hours Updated')

    name = models.CharField(max_length=100, verbose_name=_('Name'))
    slug = models.SlugField(max_length=100, unique=True, verbose_name=_('Slug'))
    url = models.URLField(
        max_length=500,
        verbose_name=_('URL'),
        help_text=_('Use {location_id} placeholder for the location PK'),
    )
    event_type = models.CharField(
        max_length=50, choices=EventType.choices, verbose_name=_('Event Type')
    )
    trigger = models.CharField(
        max_length=20,
        choices=TriggerType.choices,
        default=TriggerType.MANUAL,
        verbose_name=_('Trigger'),
    )
    api_key_ref = models.ForeignKey(
        LocationApiKey,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='webhook_endpoints',
        verbose_name=_('API Key'),
        help_text=_('Stored API key used to authenticate outgoing webhooks'),
    )
    config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_('Config'),
        help_text=_('Optional endpoint-specific overrides'),
    )
    active = models.BooleanField(default=True, verbose_name=_('Active'))

    class Meta:
        """Meta options for WebhookEndpoint."""

        app_label = 'inventree_location_hours'
        verbose_name = _('Webhook Endpoint')
        verbose_name_plural = _('Webhook Endpoints')

    def __str__(self):
        """String representation."""
        return f'{self.name} ({self.event_type})'


class GoogleOAuthToken(models.Model):
    """Encrypted Google OAuth tokens for API authentication."""

    access_token = models.TextField(
        blank=True, verbose_name=_('Access Token'), help_text=_('Encrypted at rest.')
    )
    refresh_token = models.TextField(
        blank=True, verbose_name=_('Refresh Token'), help_text=_('Encrypted at rest.')
    )
    google_email = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_('Google Email'),
        help_text=_('Email of the connected Google account'),
    )
    expires_at = models.DateTimeField(
        null=True, blank=True, verbose_name=_('Expires At')
    )
    created = models.DateTimeField(auto_now_add=True, verbose_name=_('Created'))
    updated = models.DateTimeField(auto_now=True, verbose_name=_('Updated'))

    class Meta:
        """Meta options."""

        app_label = 'inventree_location_hours'
        verbose_name = _('Google OAuth Token')
        verbose_name_plural = _('Google OAuth Tokens')

    def __str__(self):
        """String representation."""
        return self.google_email or f'Token {self.pk}'

    def set_access_token(self, plaintext):
        """Encrypt and store an access token."""
        if not plaintext:
            self.access_token = ''
            return
        from .crypto import encrypt

        self.access_token = encrypt(plaintext)

    def get_access_token(self):
        """Decrypt and return the stored access token."""
        if not self.access_token:
            return ''
        from .crypto import decrypt

        return decrypt(self.access_token)

    def set_refresh_token(self, plaintext):
        """Encrypt and store a refresh token."""
        if not plaintext:
            self.refresh_token = ''
            return
        from .crypto import encrypt

        self.refresh_token = encrypt(plaintext)

    def get_refresh_token(self):
        """Decrypt and return the stored refresh token."""
        if not self.refresh_token:
            return ''
        from .crypto import decrypt

        return decrypt(self.refresh_token)


class WebhookLog(models.Model):
    """Audit log for webhook calls."""

    webhook = models.ForeignKey(
        WebhookEndpoint,
        on_delete=models.CASCADE,
        related_name='logs',
        verbose_name=_('Webhook'),
    )
    location = models.ForeignKey(
        stock.models.StockLocation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='webhook_logs',
        verbose_name=_('Location'),
    )
    event_type = models.CharField(max_length=50, verbose_name=_('Event Type'))
    request_url = models.URLField(max_length=1000, verbose_name=_('Request URL'))
    request_body = models.TextField(blank=True, verbose_name=_('Request Body'))
    response_code = models.PositiveSmallIntegerField(
        null=True, blank=True, verbose_name=_('Response Code')
    )
    response_body = models.TextField(blank=True, verbose_name=_('Response Body'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))

    class Meta:
        """Meta options for WebhookLog."""

        app_label = 'inventree_location_hours'
        verbose_name = _('Webhook Log')
        verbose_name_plural = _('Webhook Logs')
        ordering = ['-created_at']

    def __str__(self):
        """String representation."""
        return (
            f'{self.webhook.name} -> {self.response_code or "???"} at {self.created_at}'
        )
