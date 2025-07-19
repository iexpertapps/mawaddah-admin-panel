from django.db import models
from decimal import Decimal

class SystemWallet(models.Model):
    total_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_wallet'
        verbose_name = 'System Wallet'
        verbose_name_plural = 'System Wallets'

    def __str__(self):
        return f"SystemWallet(balance={self.total_balance})"

class WalletTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('credit', 'Credit'),
        ('debit', 'Debit'),
    ]
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=8, choices=TRANSACTION_TYPE_CHOICES)
    related_donation = models.ForeignKey(
        'donations.Donation',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='wallet_transactions'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wallet_transaction'
        verbose_name = 'Wallet Transaction'
        verbose_name_plural = 'Wallet Transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type.capitalize()} {self.amount} (Donation: {self.related_donation_id})"
