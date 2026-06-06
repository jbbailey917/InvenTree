"""Webhook dispatch logic."""

import json
from datetime import timedelta

from django.utils import timezone

import requests
import structlog

from .models import WebhookLog

logger = structlog.get_logger('inventree')

GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'


def _get_push_url(account_id, location_id):
    """Return the Google Business Information API URL."""
    return (
        'https://mybusinessbusinessinformation.googleapis.com/v1/'
        f'accounts/{account_id}/locations/{location_id}'
    )


def _get_fresh_access_token():
    """Return a valid access token, refreshing if necessary."""
    from .api import _get_oauth_client_config
    from .models import GoogleOAuthToken

    token = GoogleOAuthToken.objects.filter(pk=1).first()
    if not token:
        return None

    # If still valid, return existing
    if token.expires_at and token.expires_at > timezone.now() + timedelta(minutes=2):
        return token.get_access_token()

    # Need to refresh
    refresh = token.get_refresh_token()
    if not refresh:
        return token.get_access_token()  # Return even if expired — will fail with 401

    client_id, client_secret = _get_oauth_client_config()
    if not client_id or not client_secret:
        return None

    try:
        resp = requests.post(
            GOOGLE_TOKEN_URL,
            data={
                'client_id': client_id,
                'client_secret': client_secret,
                'refresh_token': refresh,
                'grant_type': 'refresh_token',
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        logger.exception('google_token_refresh_failed')
        return token.get_access_token()  # Fall back to possibly-expired token

    token.set_access_token(data['access_token'])
    token.expires_at = timezone.now() + timedelta(seconds=data.get('expires_in', 3600))
    token.save(update_fields=['access_token', 'expires_at'])
    return data['access_token']


def dispatch_webhooks(location, hours, endpoints):
    """Dispatch hours_updated event to all active webhook endpoints.

    Returns a list of result dicts with webhook name, HTTP code, and success flag.
    """
    results = []
    for endpoint in endpoints:
        result = _send_webhook(location, hours, endpoint)
        results.append(result)
    return results


def _send_webhook(location, hours, endpoint):
    """Send a single webhook and log the result."""
    from .api import _build_hours_payload, _get_plugin_setting

    # Try OAuth token first, then fall back to stored API key
    api_key = _get_fresh_access_token()
    if not api_key:
        api_key = endpoint.api_key_ref.get_key() if endpoint.api_key_ref else ''

    account_id = _get_plugin_setting('GOOGLE_ACCOUNT_ID', '')
    push_url = (
        _get_push_url(account_id, str(location.pk))
        if account_id
        else endpoint.url.replace('{location_id}', str(location.pk))
    )

    url = push_url
    payload = _build_hours_payload(location, hours, endpoint)
    body = json.dumps(payload)
    headers = {'Content-Type': 'application/json'}
    if api_key:
        headers['Authorization'] = f'Bearer {api_key}'

    try:
        response = requests.post(url, headers=headers, data=body, timeout=30)
        code = response.status_code
        resp_body = response.text[:2000]
        success = 200 <= code < 300
    except requests.RequestException as exc:
        code = None
        resp_body = str(exc)[:2000]
        success = False

    WebhookLog.objects.create(
        webhook=endpoint,
        location=location,
        event_type='hours_updated',
        request_url=url,
        request_body=body[:5000],
        response_code=code,
        response_body=resp_body,
    )

    logger.info(
        'Webhook %s -> %s %s', endpoint.name, code or 'ERR', 'OK' if success else 'FAIL'
    )

    return {'webhook': endpoint.name, 'code': code, 'success': success}
