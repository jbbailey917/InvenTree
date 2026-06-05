"""Models for the POS Sales plugin."""

from django.db import models
from django.utils.translation import gettext_lazy as _

import company.models
import stock.models


class POSTerminal(models.Model):
    """A POS terminal configuration with encrypted API key."""

    terminal_id = models.SlugField(
        max_length=100,
        unique=True,
        verbose_name=_('Terminal ID'),
        help_text=_('Unique identifier sent in the webhook payload'),
    )
    name = models.CharField(
        max_length=200,
        verbose_name=_('Name'),
        help_text=_('Human-readable name for this terminal'),
    )
    location = models.ForeignKey(
        stock.models.StockLocation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pos_terminals',
        verbose_name=_('Stock Location'),
        help_text=_('Where stock is pulled from for sales from this terminal'),
    )
    customer = models.ForeignKey(
        company.models.Company,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pos_terminals',
        verbose_name=_('Customer'),
        help_text=_('Customer company for sales orders'),
    )
    receipt_api_endpoint = models.URLField(
        max_length=500,
        blank=True,
        verbose_name=_('Receipt API Endpoint'),
        help_text=_('External POS API URL that returns receipt line items'),
    )
    receipt_api_key = models.TextField(
        blank=True,
        verbose_name=_('Receipt API Key'),
        help_text=_('Encrypted at rest. Set via the management UI.'),
    )
    service_username = models.CharField(
        max_length=150,
        default='admin',
        verbose_name=_('Service User'),
        help_text=_('InvenTree user account used to create orders'),
    )
    active = models.BooleanField(default=True, verbose_name=_('Active'))

    class Meta:
        """Meta options."""

        app_label = 'inventree_pos_sales'
        verbose_name = _('POS Terminal')
        verbose_name_plural = _('POS Terminals')
        ordering = ['name']

    def __str__(self):
        """String representation."""
        return f'{self.name} ({self.terminal_id})'

    def set_api_key(self, plaintext):
        """Encrypt and store an API key."""
        if not plaintext:
            self.receipt_api_key = ''
            return
        from .crypto import encrypt

        self.receipt_api_key = encrypt(plaintext)

    def get_api_key(self):
        """Decrypt and return the stored API key."""
        if not self.receipt_api_key:
            return ''
        from .crypto import decrypt

        return decrypt(self.receipt_api_key)


class PosApiKey(models.Model):
    """A named API key stored for reuse across terminals."""

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

        app_label = 'inventree_pos_sales'
        verbose_name = _('POS API Key')
        verbose_name_plural = _('POS API Keys')
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
