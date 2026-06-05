"""Webhook dispatch logic."""

import json
import os

import requests
import structlog

from .models import WebhookLog

logger = structlog.get_logger('inventree')


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
    from .api import (
        _build_hours_payload,
    )  # deferred import to break circular dependency

    api_key = (
        os.environ.get(endpoint.secret_env_var, '') if endpoint.secret_env_var else ''
    )
    url = endpoint.url.replace('{location_id}', str(location.pk))
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
