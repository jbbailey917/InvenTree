"""Serializers for the POS sales plugin."""

from rest_framework import serializers


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
