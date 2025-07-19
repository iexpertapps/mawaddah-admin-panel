from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from wallet.models import Wallet, WalletTransaction, AuditLog
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=Wallet)
def create_wallet_audit_log(sender, instance, created, **kwargs):
    """Create audit log when wallet is created or updated."""
    if created:
        AuditLog.objects.create(
            actor=instance.user,
            action='wallet_created',
            target_object_id=str(instance.pk),
            metadata={'balance': str(instance.balance)}
        )
    else:
        AuditLog.objects.create(
            actor=instance.user,
            action='wallet_credited',
            target_object_id=str(instance.pk),
            metadata={'balance': str(instance.balance)}
        )

@receiver(post_save, sender=WalletTransaction)
def create_transaction_audit_log(sender, instance, created, **kwargs):
    """Create audit log when transaction is created."""
    if created:
        AuditLog.objects.create(
            actor=instance.wallet.user,
            action='wallet_credited',
            target_object_id=str(instance.wallet.pk),
            metadata={
                'amount': str(instance.amount),
                'transaction_type': instance.transaction_type,
                'description': instance.description
            }
        )

@receiver(post_delete, sender=WalletTransaction)
def create_transaction_deletion_audit_log(sender, instance, **kwargs):
    """Create audit log when transaction is deleted."""
    AuditLog.objects.create(
        actor=instance.wallet.user,
        action='wallet_credited',
        target_object_id=str(instance.wallet.pk),
        metadata={
            'amount': str(instance.amount),
            'transaction_type': instance.transaction_type,
            'description': instance.description,
            'deleted': True
        }
    ) 