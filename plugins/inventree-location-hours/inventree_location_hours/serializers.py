"""DRF serializers for location hours models."""

from django.utils.translation import gettext_lazy as _

from rest_framework import serializers

from .models import LocationApiKey, LocationHours, WebhookEndpoint, WebhookLog


class LocationHoursSerializer(serializers.ModelSerializer):
    """Serializer for LocationHours."""

    location_name = serializers.CharField(source='location.name', read_only=True)
    is_closed = serializers.BooleanField(read_only=True)
    day_display = serializers.SerializerMethodField()

    class Meta:
        """Meta options."""

        model = LocationHours
        fields = [
            'id',
            'location',
            'location_name',
            'day',
            'day_display',
            'open_time',
            'close_time',
            'is_closed',
        ]

    def get_day_display(self, obj):
        """Return the human-readable day name."""
        return obj.get_day_display()

    def validate(self, data):
        """Validate that open and close times are both set or both absent."""
        open_time = data.get('open_time')
        close_time = data.get('close_time')

        # If updating partial, get existing values from the instance
        if self.instance and not self.partial:
            if open_time is None:
                open_time = self.instance.open_time
            if close_time is None:
                close_time = self.instance.close_time

        if (open_time is None) != (close_time is None):
            raise serializers.ValidationError(
                _(
                    'Open and close times must both be set, or both be blank for a closed day.'
                )
            )

        if open_time and close_time and open_time >= close_time:
            raise serializers.ValidationError(_('Close time must be after open time.'))

        return data


class LocationApiKeySerializer(serializers.ModelSerializer):
    """Serializer for LocationApiKey. API key value is write-only."""

    api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        """Meta options."""

        model = LocationApiKey
        fields = ['id', 'name', 'description', 'api_key', 'created', 'updated']
        read_only_fields = ['id', 'created', 'updated']

    def create(self, validated_data):
        """Create an API key entry with encrypted value."""
        key = validated_data.pop('api_key', None)
        instance = super().create(validated_data)
        if key:
            instance.set_key(key)
            instance.save(update_fields=['api_key'])
        return instance

    def update(self, instance, validated_data):
        """Update an API key entry with encrypted value."""
        key = validated_data.pop('api_key', None)
        instance = super().update(instance, validated_data)
        if key is not None:
            instance.set_key(key)
            instance.save(update_fields=['api_key'])
        return instance


class WebhookEndpointSerializer(serializers.ModelSerializer):
    """Serializer for WebhookEndpoint."""

    api_key_ref_name = serializers.CharField(
        source='api_key_ref.name', read_only=True, default=''
    )

    class Meta:
        """Meta options."""

        model = WebhookEndpoint
        fields = [
            'id',
            'name',
            'slug',
            'url',
            'event_type',
            'trigger',
            'api_key_ref',
            'api_key_ref_name',
            'config',
            'active',
        ]


class WebhookLogSerializer(serializers.ModelSerializer):
    """Serializer for WebhookLog (read-only)."""

    webhook_name = serializers.CharField(source='webhook.name', read_only=True)

    class Meta:
        """Meta options."""

        model = WebhookLog
        fields = [
            'id',
            'webhook',
            'webhook_name',
            'location',
            'event_type',
            'request_url',
            'response_code',
            'response_body',
            'created_at',
        ]
        read_only_fields = ['id', 'webhook_name', 'created_at']
