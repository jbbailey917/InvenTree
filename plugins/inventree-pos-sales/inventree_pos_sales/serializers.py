"""Serializers for the POS sales plugin."""

from rest_framework import serializers

from .models import PosApiKey, POSTerminal


class PosWebhookInboundSerializer(serializers.Serializer):
    """Inbound webhook payload for POS sales."""

    receipt_id = serializers.CharField(required=False)
    location_id = serializers.CharField(required=False)
    id = serializers.CharField(required=False)
    location = serializers.CharField(required=False)


class PosWebhookResponseSerializer(serializers.Serializer):
    """Response returned after processing a POS sale."""

    success = serializers.BooleanField()
    receipt_id = serializers.CharField()
    location_id = serializers.CharField()
    sales_order_id = serializers.IntegerField()
    sales_order_reference = serializers.CharField()
    message = serializers.CharField()


class POSTerminalSerializer(serializers.ModelSerializer):
    """Serializer for POSTerminal. API key is write-only."""

    location_name = serializers.CharField(source='location.name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        """Meta options."""

        model = POSTerminal
        fields = [
            'id',
            'terminal_id',
            'name',
            'location',
            'location_name',
            'customer',
            'customer_name',
            'receipt_api_endpoint',
            'api_key',
            'service_username',
            'active',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        """Create a terminal with encrypted API key."""
        api_key = validated_data.pop('api_key', None)
        instance = super().create(validated_data)
        if api_key:
            instance.set_api_key(api_key)
            instance.save(update_fields=['receipt_api_key'])
        return instance

    def update(self, instance, validated_data):
        """Update a terminal with encrypted API key."""
        api_key = validated_data.pop('api_key', None)
        instance = super().update(instance, validated_data)
        if api_key is not None:
            instance.set_api_key(api_key)
            instance.save(update_fields=['receipt_api_key'])
        return instance


class PosApiKeySerializer(serializers.ModelSerializer):
    """Serializer for PosApiKey. API key value is write-only."""

    api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        """Meta options."""

        model = PosApiKey
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
