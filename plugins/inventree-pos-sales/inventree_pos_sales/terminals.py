"""API endpoints for POS terminal management."""

from rest_framework import generics

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


class ApiKeyListCreate(generics.ListCreateAPIView):
    """List all POS API keys or create a new one."""

    queryset = PosApiKey.objects.all()
    serializer_class = PosApiKeySerializer


class ApiKeyDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a POS API key."""

    queryset = PosApiKey.objects.all()
    serializer_class = PosApiKeySerializer
