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
    secret_env_var = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_('Secret Env Variable'),
        help_text=_(
            'Name of environment variable holding the API key (never stored in DB)'
        ),
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
