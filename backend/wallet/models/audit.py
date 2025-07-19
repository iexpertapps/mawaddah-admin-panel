from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("wallet_created", "Wallet Created"),
        ("wallet_credited", "Wallet Credited"),
        ("withdrawal_approved", "Withdrawal Approved"),
        ("withdrawal_rejected", "Withdrawal Rejected"),
    ]
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='audit_logs')
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    target_object_id = models.CharField(max_length=64)
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(blank=True, null=True)

    def __str__(self):
        actor_id = self.actor_id if self.actor else None
        return f"AuditLog({self.action}, actor={actor_id}, target={self.target_object_id})" 