from decimal import Decimal
from donations.models import SystemWallet, WalletTransaction, Donation
from django.db import transaction
import logging

class WalletService:
    """
    Service for managing the system wallet balance and transaction log.
    """
    @classmethod
    def add_to_system_wallet(cls, amount: Decimal, related_donation: Donation = None) -> Decimal:
        if amount <= 0:
            raise ValueError('Amount must be positive')
        with transaction.atomic():
            wallet, _ = SystemWallet.objects.select_for_update().get_or_create(pk=1)
            wallet.total_balance += amount
            wallet.save()
            WalletTransaction.objects.create(
                amount=amount,
                type='credit',
                related_donation=related_donation
            )
            logging.info(f"Added {amount} to system wallet. New balance: {wallet.total_balance}")
            return wallet.total_balance

    @classmethod
    def get_balance(cls) -> Decimal:
        wallet, _ = SystemWallet.objects.get_or_create(pk=1)
        return wallet.total_balance

    @classmethod
    def get_transactions(cls):
        return list(WalletTransaction.objects.all().order_by('-created_at')) 