from django.db import models
from django.conf import settings

class WalletTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ("credit", "Credit"),
        ("debit", "Debit"),
    ]
    wallet = models.ForeignKey('wallet.Wallet', on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=8, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    appeal = models.ForeignKey('appeals.Appeal', on_delete=models.CASCADE, related_name='wallet_transactions')
    donor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='donor_wallet_transactions')
    description = models.CharField(max_length=255, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    transfer_by = models.CharField(
        max_length=20,
        choices=[('Donor', 'Donor'), ('Admin', 'Admin'), ('System', 'System')],
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.type} {self.amount} (Wallet: {self.wallet_id}, Appeal: {self.appeal_id})" 