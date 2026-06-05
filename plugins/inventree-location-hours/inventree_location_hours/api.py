"""API endpoints for the Location Hours plugin."""

from django.shortcuts import get_object_or_404

import structlog
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

import stock.models
from InvenTree.mixins import ListAPI, ListCreateAPI, RetrieveUpdateDestroyAPI
from plugin.models import PluginConfig

from .models import LocationHours, WebhookEndpoint, WebhookLog
from .serializers import (
    LocationHoursSerializer,
    WebhookEndpointSerializer,
    WebhookLogSerializer,
)
from .webhooks import dispatch_webhooks

logger = structlog.get_logger('inventree')


class LocationHoursListCreate(ListCreateAPI):
    """List and create location hours entries."""

    queryset = LocationHours.objects.all()
    serializer_class = LocationHoursSerializer

    def get_queryset(self):
        """Filter by location if provided."""
        qs = super().get_queryset()
        location = self.request.query_params.get('location')
        if location:
            qs = qs.filter(location__pk=location)
        return qs.select_related('location')


class LocationHoursDetail(RetrieveUpdateDestroyAPI):
    """Retrieve, update, or delete a single hours entry."""

    queryset = LocationHours.objects.all()
    serializer_class = LocationHoursSerializer


class LocationHoursBulkUpdate(APIView):
    """Bulk update or create location hours entries."""

    permission_classes = [IsAuthenticated]
    queryset = LocationHours.objects.none()

    def post(self, request):
        """Handle bulk create/update of hours entries."""
        results = {'updated': [], 'created': []}
        for entry in request.data:
            pk = entry.get('id')
            if pk:
                instance = get_object_or_404(LocationHours, pk=pk)
                serializer = LocationHoursSerializer(instance, data=entry, partial=True)
            else:
                # Check if an entry already exists for this location+day
                loc = entry.get('location')
                day = entry.get('day')
                instance = LocationHours.objects.filter(location=loc, day=day).first()
                if instance:
                    serializer = LocationHoursSerializer(
                        instance, data=entry, partial=True
                    )
                else:
                    serializer = LocationHoursSerializer(data=entry)
            if not serializer.is_valid():
                return Response(serializer.errors, status=400)
            serializer.save()
            if pk or instance:
                results['updated'].append(serializer.data)
            else:
                results['created'].append(serializer.data)
        return Response(results)


class PushHoursView(APIView):
    """Push operating hours to all active webhook endpoints."""

    permission_classes = [IsAuthenticated]
    queryset = LocationHours.objects.none()

    def post(self, request, location_pk):
        """Dispatch webhooks for the given location."""
        location = get_object_or_404(stock.models.StockLocation, pk=location_pk)
        hours = LocationHours.objects.filter(location=location)
        endpoints = WebhookEndpoint.objects.filter(
            active=True, event_type='hours_updated'
        )
        results = dispatch_webhooks(location, hours, endpoints)
        logger.info(
            'Push complete',
            location_pk=location_pk,
            endpoint_count=len(endpoints),
            result_count=len(results),
        )
        return Response({'results': results})


class WebhookEndpointListCreate(ListCreateAPI):
    """List and create webhook endpoints."""

    queryset = WebhookEndpoint.objects.all()
    serializer_class = WebhookEndpointSerializer


class WebhookEndpointDetail(RetrieveUpdateDestroyAPI):
    """Retrieve, update, or delete a webhook endpoint."""

    queryset = WebhookEndpoint.objects.all()
    serializer_class = WebhookEndpointSerializer


class LocationHoursOverview(APIView):
    """Return all locations with their hours in a flattened format for the bulk editor."""

    permission_classes = [IsAuthenticated]
    queryset = LocationHours.objects.none()

    def get(self, request):
        """Return locations with hours summary."""
        from collections import defaultdict

        google_account_id = _get_plugin_setting('GOOGLE_ACCOUNT_ID', '')

        hours = defaultdict(dict)
        for h in LocationHours.objects.select_related('location').all():
            loc = h.location
            hours[loc.pk]['location_pk'] = loc.pk
            hours[loc.pk]['location_name'] = loc.name
            hours[loc.pk]['google_location_id'] = (loc.metadata or {}).get(
                'google_location_id', ''
            )
            hours[loc.pk][str(h.day)] = {
                'id': h.pk,
                'open': str(h.open_time)[:5] if h.open_time else None,
                'close': str(h.close_time)[:5] if h.close_time else None,
                'closed': h.is_closed,
            }

        locations = stock.models.StockLocation.objects.filter(structural=False).exclude(
            pk__in=hours.keys()
        )

        for loc in locations:
            hours[loc.pk] = {
                'location_pk': loc.pk,
                'location_name': loc.name,
                'google_location_id': (loc.metadata or {}).get(
                    'google_location_id', ''
                ),
            }

        return Response({
            'google_account_id': google_account_id,
            'locations': sorted(
                hours.values(), key=lambda x: x.get('location_name', '')
            ),
        })


class WebhookLogList(ListAPI):
    """Read-only list of webhook dispatch logs."""

    queryset = WebhookLog.objects.all()
    serializer_class = WebhookLogSerializer

    def get_queryset(self):
        """Filter by webhook, location, or event_type."""
        qs = super().get_queryset()
        for param in ('webhook', 'location', 'event_type'):
            val = self.request.query_params.get(param)
            if val:
                qs = qs.filter(**{
                    f'{param}__pk' if param != 'event_type' else param: val
                })
        return qs.select_related('webhook', 'location')


def _get_plugin_setting(key, default=''):
    """Look up a plugin setting value from the active PluginConfig."""
    try:
        cfg = PluginConfig.objects.filter(key='location-hours', active=True).first()
        if cfg is not None:
            return cfg.plugin_settings.get(key, default)
    except Exception:
        pass
    return default


def _build_hours_payload(location, hours, endpoint):
    """Build the webhook payload for a hours_updated event."""
    _ = endpoint  # unused, reserved for future per-endpoint payload customisation
    metadata = location.metadata or {}
    google_id = metadata.get('google_location_id', '')
    timezone = _get_plugin_setting('DEFAULT_TIMEZONE', 'America/Chicago')
    days_data = []
    for h in hours:
        days_data.append({
            'day': h.day,
            'day_name': h.get_day_display(),
            'open': str(h.open_time)[:5] if h.open_time else None,
            'close': str(h.close_time)[:5] if h.close_time else None,
            'closed': h.is_closed,
        })
    return {
        'event': 'hours_updated',
        'location_id': location.pk,
        'location_name': location.name,
        'google_location_id': google_id,
        'timezone': timezone,
        'hours': days_data,
    }
