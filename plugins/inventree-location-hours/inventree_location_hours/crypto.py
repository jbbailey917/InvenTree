"""Simple Fernet encryption using Django's SECRET_KEY for key derivation."""

import base64
import hashlib

from cryptography.fernet import Fernet


def _get_fernet():
    """Return a Fernet instance keyed from Django's SECRET_KEY."""
    from django.conf import settings

    raw = settings.SECRET_KEY
    key_bytes = hashlib.sha256(raw.encode()).digest()
    key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(key)


def encrypt(plaintext):
    """Encrypt a plaintext string. Returns a base64-encoded token."""
    if not plaintext:
        return ''
    f = _get_fernet()
    return f.encrypt(plaintext.encode()).decode()


def decrypt(token):
    """Decrypt a token back to plaintext. Returns empty string on failure."""
    if not token:
        return ''
    try:
        f = _get_fernet()
        return f.decrypt(token.encode()).decode()
    except Exception:
        return ''
