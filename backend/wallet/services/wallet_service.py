from decimal import Decimal
from django.db import transaction, models
from django.utils import timezone
from django.core.exceptions import ValidationError, PermissionDenied
from rest_framework.exceptions import PermissionDenied

from wallet.models import Wallet, WalletTransaction
from appeals.models import Appeal
from django.contrib.auth import get_user_model
from wallet.utils import generate_description, resolve_transfer_by

User = get_user_model()

def create_wallet_for_user(user):
    if not Wallet.objects.filter(user=user).exists():
        return Wallet.objects.create(user=user, balance=Decimal('0.00'))
    return Wallet.objects.get(user=user)

def credit_wallet(user, amount, appeal, donor=None, description=None, created_by=None, action_type=None):
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    wallet = Wallet.objects.select_for_update().get(user=user)
    wallet.balance += amount
    wallet.save()

    # Determine description
    if description:
        desc = description
    elif action_type == 'donation':
        desc = f"Donation credited – Appeal #{appeal.pk}"
    elif action_type == 'withdrawal':
        desc = f"Funds disbursed – Appeal #{appeal.pk}"
    elif action_type == 'rejected_withdrawal':
        desc = f"Withdrawal rejected – Appeal #{appeal.pk}"
    elif action_type == 'admin_credit':
        desc = "Manual credit added by Admin"
    elif action_type == 'manual_adjustment':
        desc = "Manual balance adjustment"
    elif action_type == 'refund':
        desc = f"Refund issued – Appeal #{appeal.pk}"
    else:
        desc = "Transaction"

    # Determine transfer_by
    if created_by:
        role = getattr(created_by, 'role', None)
        if role == 'donor':
            transfer_by = 'Donor'
        elif role == 'admin':
            transfer_by = 'Admin'
        else:
            transfer_by = 'System'
    elif donor:
        transfer_by = 'Donor'
    else:
        transfer_by = 'System'

    WalletTransaction.objects.create(
        wallet=wallet,
        type='credit',
        amount=amount,
        appeal=appeal,
        donor=donor,
        description=desc,
        transfer_by=transfer_by
    )
    return wallet

def debit_wallet(user, amount, appeal=None, created_by=None):
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    wallet = Wallet.objects.select_for_update().get(user=user)
    wallet.balance -= amount
    wallet.save()
    description = generate_description('withdrawal', appeal)
    transfer_by = resolve_transfer_by(created_by)
    WalletTransaction.objects.create(
        wallet=wallet,
        type='debit',
        amount=amount,
        appeal=appeal,
        donor=None,
        description=description,
        transfer_by=transfer_by
    )
    return wallet

def reject_withdrawal(appeal, created_by):
    user = appeal.beneficiary
    wallet = Wallet.objects.select_for_update().get(user=user)
    description = generate_description('rejected_withdrawal', appeal)
    transfer_by = 'Admin'
    WalletTransaction.objects.create(
        wallet=wallet,
        type='debit',
        amount=0,
        appeal=appeal,
        donor=None,
        description=description,
        transfer_by=transfer_by
    )
    return wallet

def manual_credit(user, amount, created_by):
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    wallet = Wallet.objects.select_for_update().get(user=user)
    wallet.balance += amount
    wallet.save()
    description = generate_description('admin_credit')
    transfer_by = 'Admin'
    WalletTransaction.objects.create(
        wallet=wallet,
        type='credit',
        amount=amount,
        appeal=None,
        donor=None,
        description=description,
        transfer_by=transfer_by
    )
    return wallet

def adjust_wallet_balance(user, amount, reason, created_by):
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    wallet = Wallet.objects.select_for_update().get(user=user)
    wallet.balance += amount
    wallet.save()
    description = generate_description('manual_adjustment', reason=reason)
    transfer_by = 'Admin'
    WalletTransaction.objects.create(
        wallet=wallet,
        type='credit' if amount > 0 else 'debit',
        amount=abs(amount),
        appeal=None,
        donor=None,
        description=description,
        transfer_by=transfer_by
    )
    return wallet

def issue_refund(user, amount, appeal=None, created_by=None):
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    wallet = Wallet.objects.select_for_update().get(user=user)
    wallet.balance += amount
    wallet.save()
    description = generate_description('refund', appeal)
    transfer_by = resolve_transfer_by(created_by)
    WalletTransaction.objects.create(
        wallet=wallet,
        type='credit',
        amount=amount,
        appeal=appeal,
        donor=None,
        description=description,
        transfer_by=transfer_by
    )
    return wallet

def get_wallet_stats(user):
    """
    Get wallet statistics for a user.
    
    Args:
        user: The user to get stats for
    
    Returns:
        dict: Wallet statistics including credited and withdrawn amounts
    """
    # Total credited: sum of fulfilled appeals for this user
    total_credited = Appeal.objects.filter(
        beneficiary=user, 
        status='fulfilled'
    ).aggregate(total=models.Sum('amount_requested'))['total'] or Decimal('0.00')
    
    # Total withdrawn: sum of debit transactions for this user
    total_withdrawn = WalletTransaction.objects.filter(
        wallet__user=user, 
        type='debit'
    ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
    
    available_balance = total_credited - total_withdrawn
    
    return {
        'total_credited': total_credited,
        'total_withdrawn': total_withdrawn,
        'available_balance': available_balance
    }

def get_available_balance(user):
    """
    Get the available balance for a user (credited - withdrawn).
    
    Args:
        user: The user to get balance for
    
    Returns:
        Decimal: Available balance
    """
    stats = get_wallet_stats(user)
    return stats['available_balance'] 