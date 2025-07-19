from django.db import models
from django.conf import settings

# Create your models here.

class Setting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField()
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key}: {self.value}"

class SettingChangeLog(models.Model):
    setting = models.ForeignKey(Setting, on_delete=models.CASCADE, related_name='change_logs')
    old_value = models.JSONField()
    new_value = models.JSONField()
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    # Add more fields as needed for Phase 2

    def __str__(self):
        try:
            key = self.setting.key
        except Exception:
            key = 'Unknown'
        return f"Change for {key} at {self.changed_at}"
