from django.db import transaction
from appeals.models import Appeal
from donations.models import SystemWallet, WalletTransaction
from decimal import Decimal
import logging
from wallet.utils import generate_description, resolve_transfer_by

class AppealFulfillmentService:
    @classmethod
    def fulfill_approved_appeals(cls):
        with transaction.atomic():
            # Fetch all approved, unfulfilled appeals
            appeals = Appeal.objects.select_for_update().filter(status='approved', is_fulfilled=False)
            wallet, _ = SystemWallet.objects.select_for_update().get_or_create(pk=1)
            for appeal in appeals:
                if wallet.total_balance >= appeal.amount_requested:
                    # Deduct from wallet
                    wallet.total_balance -= appeal.amount_requested
                    wallet.save()
                    # Log transaction
                    WalletTransaction.objects.create(
                        amount=appeal.amount_requested,
                        type='debit',
                        description=generate_description('withdrawal', appeal),
                        transfer_by='System',
                        related_donation=None  # No direct donation, but could be linked if needed
                    )
                    # Mark appeal as fulfilled
                    appeal.is_fulfilled = True
                    appeal.status = 'fulfilled'
                    appeal.save()
                    logging.info(f"Fulfilled appeal {appeal.id}: {appeal.amount_requested} debited from system wallet.")
