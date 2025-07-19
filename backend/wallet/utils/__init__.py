from decimal import Decimal

def generate_description(action, appeal=None, reason=None):
    if action == 'donation':
        return f"Donation credited – Appeal #{appeal.pk}" if appeal else "Donation credited"
    elif action == 'withdrawal':
        return f"Funds disbursed – Appeal #{appeal.pk}" if appeal else "Funds disbursed"
    elif action == 'rejected_withdrawal':
        return f"Withdrawal rejected – Appeal #{appeal.pk}" if appeal else "Withdrawal rejected"
    elif action == 'admin_credit':
        return "Manual credit added by Admin"
    elif action == 'manual_adjustment':
        return f"Manual balance adjustment – {reason}" if reason else "Manual balance adjustment"
    elif action == 'refund':
        return f"Refund issued – Appeal #{appeal.pk}" if appeal else "Refund issued"
    else:
        return "Transaction"

def resolve_transfer_by(created_by):
    if created_by:
        role = getattr(created_by, 'role', None)
        if role == 'donor':
            return 'Donor'
        elif role == 'admin':
            return 'Admin'
    return 'System' 