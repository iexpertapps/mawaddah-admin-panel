from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Setting
from .serializers import SettingSerializer, SETTINGS_SCHEMA, SENSITIVE_MASK
from .permissions import IsAdminOrShura
from django.db import transaction

# Create your views here.

class SettingsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsAdminOrShura]

    def list(self, request):
        """GET /api/settings/ - Return all settings as flat JSON, fallback to defaults."""
        queryset = Setting.objects.all()
        serializer = SettingSerializer(queryset)
        return Response(serializer.data)

    @transaction.atomic
    def partial_update(self, request):
        """PATCH /api/settings/ - Update only changed fields, ignore masked sensitive fields."""
        data = request.data
        serializer = SettingSerializer(data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        validated: dict = serializer.validated_data
        updated = {}
        for key, value in validated.items():
            meta: dict = SETTINGS_SCHEMA.get(key, {})
            if not meta:
                continue
            # Sensitive: skip if masked
            if meta.get('sensitive') and (value == SENSITIVE_MASK or not value):
                continue
            obj, created = Setting.objects.get_or_create(key=key, defaults={'value': value, 'updated_by': request.user})
            if not created and obj.value != value:
                obj.value = value
                obj.updated_by = request.user
                obj.save()
            updated[key] = value
        # Return updated settings
        queryset = Setting.objects.all()
        out_serializer = SettingSerializer(queryset)
        return Response(out_serializer.data, status=status.HTTP_200_OK)
