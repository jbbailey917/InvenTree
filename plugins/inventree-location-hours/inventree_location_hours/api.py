"""API endpoints for the Location Hours plugin."""

from datetime import timedelta
from urllib.parse import urlencode

from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone

import requests
import structlog
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

import stock.models
from InvenTree.mixins import ListAPI, ListCreateAPI, RetrieveUpdateDestroyAPI
from plugin.models import PluginConfig

from .models import (
    GoogleOAuthToken,
    LocationApiKey,
    LocationHours,
    WebhookEndpoint,
    WebhookLog,
)
from .serializers import (
    LocationApiKeySerializer,
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

        hidden = (
            Q(location__name__icontains='lost')
            | Q(location__name__icontains='stolen')
            | Q(location__structural=True)
            | Q(location__external=True)
        )

        hours = defaultdict(dict)
        for h in LocationHours.objects.select_related('location').exclude(hidden):
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

        locations = (
            stock.models.StockLocation.objects
            .filter(structural=False, external=False)
            .exclude(Q(name__icontains='lost') | Q(name__icontains='stolen'))
            .exclude(pk__in=hours.keys())
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


class ApiKeyListCreate(ListCreateAPI):
    """List all location API keys or create a new one."""

    queryset = LocationApiKey.objects.all()
    serializer_class = LocationApiKeySerializer


class ApiKeyDetail(RetrieveUpdateDestroyAPI):
    """Retrieve, update, or delete a location API key."""

    queryset = LocationApiKey.objects.all()
    serializer_class = LocationApiKeySerializer


# ─── Google OAuth ───

GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'
OAUTH_SCOPE = 'https://www.googleapis.com/auth/business.manage'
OAUTH_REDIRECT_PATH = '/plugin/location-hours/google-auth/callback/'


def _get_oauth_client_config():
    """Return (client_id, client_secret) from plugin settings."""
    client_id = _get_plugin_setting('GOOGLE_OAUTH_CLIENT_ID', '')
    client_secret = _get_plugin_setting('GOOGLE_OAUTH_CLIENT_SECRET', '')
    return client_id, client_secret


def _build_redirect_uri(request):
    """Build the OAuth redirect URI from the current request."""
    scheme = 'https' if request.is_secure() else 'http'
    host = request.get_host()
    return f'{scheme}://{host}{OAUTH_REDIRECT_PATH}'


class GoogleAuthBegin(APIView):
    """Redirect to Google's OAuth consent screen."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Initiate OAuth flow."""
        client_id, _ = _get_oauth_client_config()
        if not client_id:
            return Response(
                {'detail': 'Google OAuth client ID not configured in plugin settings.'},
                status=400,
            )

        params = {
            'client_id': client_id,
            'redirect_uri': _build_redirect_uri(request),
            'response_type': 'code',
            'scope': OAUTH_SCOPE,
            'access_type': 'offline',
            'prompt': 'consent',
        }
        return redirect(f'{GOOGLE_AUTH_URL}?{urlencode(params)}')


class GoogleAuthCallback(APIView):
    """Handle the OAuth callback from Google."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Exchange auth code for tokens and store them."""
        code = request.GET.get('code')
        error = request.GET.get('error')

        if error or not code:
            logger.warning('google_oauth_denied', error=error)
            # Redirect back to the hours page
            return redirect('/web/plugin/location-hours/overview/?oauth=denied')

        client_id, client_secret = _get_oauth_client_config()
        if not client_id or not client_secret:
            return redirect('/web/plugin/location-hours/overview/?oauth=error')

        try:
            resp = requests.post(
                GOOGLE_TOKEN_URL,
                data={
                    'client_id': client_id,
                    'client_secret': client_secret,
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': _build_redirect_uri(request),
                },
                timeout=15,
            )
            resp.raise_for_status()
            token_data = resp.json()
        except (requests.RequestException, ValueError):
            logger.exception('google_oauth_token_exchange_failed')
            return redirect('/web/plugin/location-hours/overview/?oauth=error')

        # Fetch user info
        email = ''
        try:
            user_resp = requests.get(
                GOOGLE_USERINFO_URL,
                headers={'Authorization': f'Bearer {token_data["access_token"]}'},
                timeout=10,
            )
            if user_resp.ok:
                email = user_resp.json().get('email', '')
        except Exception:
            pass

        # Store or update the token (single-record model)
        oauth, _ = GoogleOAuthToken.objects.get_or_create(pk=1)
        oauth.set_access_token(token_data['access_token'])
        if token_data.get('refresh_token'):
            oauth.set_refresh_token(token_data['refresh_token'])
        oauth.google_email = email
        oauth.expires_at = timezone.now() + timedelta(
            seconds=token_data.get('expires_in', 3600)
        )
        oauth.save()

        logger.info('google_oauth_connected', email=email)
        return redirect('/web/plugin/location-hours/overview/?oauth=connected')


class GoogleAuthStatus(APIView):
    """Return the current OAuth connection status."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return connection status and email."""
        oauth = GoogleOAuthToken.objects.filter(pk=1).first()
        if not oauth or (not oauth.refresh_token and not oauth.access_token):
            return Response({'connected': False})

        return Response({
            'connected': True,
            'email': oauth.google_email,
            'expires_at': oauth.expires_at.isoformat() if oauth.expires_at else None,
        })


class GoogleDisconnect(APIView):
    """Disconnect the Google OAuth connection."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Clear stored OAuth tokens."""
        GoogleOAuthToken.objects.all().delete()
        logger.info('google_oauth_disconnected')
        return Response({'connected': False})
