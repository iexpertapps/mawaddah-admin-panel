from users.models import User
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from decimal import Decimal
from django.db import models


def list_users():
    """Get all users with optimized queryset"""
    return User.objects.all().select_related()


def create_user(validated_data):
    """Create a new user with validation"""
    try:
        user = User.objects.create_user(**validated_data)
        return user
    except ValidationError as e:
        raise ValidationError(f"User creation failed: {e}")


def get_user(pk):
    """Get user by primary key"""
    return get_object_or_404(User, pk=pk)


def get_user_by_email(email):
    """Get user by email"""
    return get_object_or_404(User, email=email)


def update_user(user, validated_data):
    """Update user with validation"""
    try:
        for attr, value in validated_data.items():
            setattr(user, attr, value)
        user.full_clean()  # Run validation
        user.save()
        return user
    except ValidationError as e:
        raise ValidationError(f"User update failed: {e}")


def delete_user(user):
    """Delete user with checks"""
    if user.wallet_balance > 0:
        raise ValidationError("Cannot delete user with wallet balance")
    user.delete()


def get_users_by_role(role):
    """Get users filtered by role"""
    return User.objects.filter(role=role).select_related()


def get_verified_recipients():
    """Get all verified syed recipients"""
    return User.objects.filter(
        role='recipient',
        is_verified_syed=True
    ).select_related()


def get_donors():
    """Get all donors"""
    return User.objects.filter(role='donor').select_related()


def get_shura_members():
    """Get all shura members"""
    return User.objects.filter(role='shura').select_related()


def add_to_wallet(user, amount):
    """Add amount to user's wallet (system method)"""
    if amount <= 0:
        raise ValueError("Amount must be positive")
    
    try:
        user.add_to_wallet(amount)
        return user
    except Exception as e:
        raise ValidationError(f"Failed to add to wallet: {e}")


def deduct_from_wallet(user, amount):
    """Deduct amount from user's wallet (system method)"""
    if amount <= 0:
        raise ValueError("Amount must be positive")
    
    try:
        user.deduct_from_wallet(amount)
        return user
    except Exception as e:
        raise ValidationError(f"Failed to deduct from wallet: {e}")


def verify_syed_status(user):
    """Verify a user as a syed (admin function)"""
    if user.role != 'recipient':
        raise ValidationError("Only recipients can be verified as syed")
    
    user.is_verified_syed = True
    user.save(update_fields=['is_verified_syed', 'updated_at'])
    return user


def update_withdrawal_details(user, withdraw_method, account_title, account_number, bank_name=None):
    """Update user's withdrawal details with validation"""
    if withdraw_method == 'bank' and not bank_name:
        raise ValidationError("Bank name is required for bank transfers")
    
    user.withdraw_method = withdraw_method
    user.account_title = account_title
    user.account_number = account_number
    user.bank_name = bank_name
    user.save(update_fields=['withdraw_method', 'account_title', 'account_number', 'bank_name', 'updated_at'])
    return user


def can_submit_appeals(user):
    """Check if user can submit appeals"""
    return user.can_submit_appeals


def get_user_statistics():
    """Get user statistics for admin dashboard"""
    total_users = User.objects.count()
    total_donors = User.objects.filter(role='donor').count()
    total_recipients = User.objects.filter(role='recipient').count()
    verified_recipients = User.objects.filter(role='recipient', is_verified_syed=True).count()
    total_wallet_balance = User.objects.aggregate(
        total=models.Sum('wallet_balance')
    )['total'] or Decimal('0.00')
    
    return {
        'total_users': total_users,
        'total_donors': total_donors,
        'total_recipients': total_recipients,
        'verified_recipients': verified_recipients,
        'total_wallet_balance': total_wallet_balance,
    } 