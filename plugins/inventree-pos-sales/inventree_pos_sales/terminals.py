"""API endpoints for POS terminal management."""

from rest_framework import generics
from rest_framework.response import Response

from .models import PosApiKey, POSTerminal
from .serializers import PosApiKeySerializer, POSTerminalSerializer


class TerminalListCreate(generics.ListCreateAPIView):
    """List all terminals or create a new one."""

    queryset = POSTerminal.objects.all()
    serializer_class = POSTerminalSerializer


class TerminalDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a terminal."""

    queryset = POSTerminal.objects.all()
    serializer_class = POSTerminalSerializer


class TerminalApiKeyDetail(generics.GenericAPIView):
    """Retrieve the decrypted API key for a terminal."""

    queryset = POSTerminal.objects.all()

    def get(self, request, *args, **kwargs):
        """Return the decrypted API key for a terminal."""
        terminal = self.get_object()
        return Response({'api_key': terminal.get_api_key()})


class ApiKeyListCreate(generics.ListCreateAPIView):
    """List all POS API keys or create a new one."""

    queryset = PosApiKey.objects.all()
    serializer_class = PosApiKeySerializer


class ApiKeyDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a POS API key."""

    queryset = PosApiKey.objects.all()
    serializer_class = PosApiKeySerializer


class ApiKeyReveal(generics.GenericAPIView):
    """Retrieve the decrypted value of a POS API key."""

    queryset = PosApiKey.objects.all()

    def get(self, request, *args, **kwargs):
        """Return the decrypted API key value."""
        key = self.get_object()
        return Response({'api_key': key.get_key()})
