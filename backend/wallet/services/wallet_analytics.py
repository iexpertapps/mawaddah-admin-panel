from django.db.models import Sum, Q
from users.models import User
from wallet.models import Wallet, WalletTransaction
from django.core.paginator import Paginator
from django.utils import timezone

def get_platform_overview():
    total_withdrawn = WalletTransaction.objects.filter(type='debit').aggregate(total=Sum('amount'))['total'] or 0
    total_credits = WalletTransaction.objects.filter(type='credit').aggregate(total=Sum('amount'))['total'] or 0
    total_debits = WalletTransaction.objects.filter(type='debit').aggregate(total=Sum('amount'))['total'] or 0
    total_transactions = WalletTransaction.objects.count()
    total_balance = Wallet.objects.aggregate(total=Sum('balance'))['total'] or 0
    return {
        'total_transactions': total_transactions,
        'total_credits': total_credits,
        'total_debits': total_debits,
        'total_disbursed': total_withdrawn,
        'total_withdrawn_amount': total_withdrawn,  # for backward compatibility
        'total_current_balance': total_balance,
    }, None

def get_recipient_wallet_stats(page=1, page_size=10):
    recipients = User.objects.filter(role='recipient').order_by('-wallet__balance')
    paginator = Paginator(recipients, page_size)
    page_obj = paginator.get_page(page)
    results = []
    for user in page_obj:
        wallet = getattr(user, 'wallet', None)
        total_received = WalletTransaction.objects.filter(wallet__user=user, type='credit').aggregate(total=Sum('amount'))['total'] or 0
        total_withdrawn = WalletTransaction.objects.filter(wallet__user=user, type='debit').aggregate(total=Sum('amount'))['total'] or 0
        current_balance = wallet.balance if wallet else 0
        # Use full_name property if it exists, else fallback to first + last name, else email
        name = getattr(user, 'full_name', None)
        if not name:
            name = f"{user.first_name} {user.last_name}".strip() or user.email
        results.append({
            'id': user.id,
            'name': name,
            'email': user.email,
            'total_received': total_received,
            'total_withdrawn': total_withdrawn,
            'current_balance': current_balance,
        })
    return {
        'count': paginator.count,
        'next': page_obj.next_page_number() if page_obj.has_next() else None,
        'previous': page_obj.previous_page_number() if page_obj.has_previous() else None,
        'results': results,
    }, None

def get_recipient_withdrawals(user_id):
    user = User.objects.filter(id=user_id, role='recipient').first()
    if not user:
        return None, 'Recipient not found or invalid role'
    withdrawals = WalletTransaction.objects.filter(wallet__user=user, type='debit').order_by('-timestamp')
    data = [
        {'date': w.timestamp.date().isoformat(), 'amount': w.amount}
        for w in withdrawals
    ]
    return data, None

def get_recipient_transfers(user_id):
    user = User.objects.filter(id=user_id, role='recipient').first()
    if not user:
        return None, 'Recipient not found or invalid role'
    transfers = WalletTransaction.objects.filter(wallet__user=user, type='credit').order_by('-timestamp')
    result = []
    for t in transfers:
        if hasattr(t, 'transferred_by_user') and t.transferred_by_user:
            transferred_by = t.transferred_by_user.get_full_name() or t.transferred_by_user.email
        else:
            transferred_by = 'System'
        result.append({
            'date': t.timestamp.date().isoformat(),
            'amount': t.amount,
            'transferred_by': transferred_by,
        })
    return result, None

def get_admin_transactions(page=1, page_size=10, search=None):
    from users.models import User
    qs = WalletTransaction.objects.select_related('wallet__user').order_by('-timestamp')
    if search:
        qs = qs.filter(
            Q(wallet__user__first_name__icontains=search) |
            Q(wallet__user__last_name__icontains=search) |
            Q(wallet__user__email__icontains=search)
        )
    paginator = Paginator(qs, page_size)
    page_obj = paginator.get_page(page)
    results = []
    for tx in page_obj:
        user = tx.wallet.user
        name = getattr(user, 'full_name', None) or f"{user.first_name} {user.last_name}".strip() or user.email
        # Appeal info
        appeal = tx.appeal if hasattr(tx, 'appeal') else None
        results.append({
            'id': tx.id,
            'user_name': name,
            'user_email': user.email,
            'user_role': getattr(user, 'role', None),
            'user_id': user.id,
            'amount': tx.amount,
            'type': tx.type,
            'description': tx.description or '',
            'timestamp': tx.timestamp,
            'appeal_id': appeal.id if appeal else None,
            'appeal_title': appeal.title if appeal else '',
            'appeal_status': appeal.status if appeal else '',
            'appeal_amount_requested': appeal.amount_requested if appeal else None,
            'transfer_by': getattr(tx, 'transfer_by', None),
        })
    return {
        'count': paginator.count,
        'next': page_obj.next_page_number() if page_obj.has_next() else None,
        'previous': page_obj.previous_page_number() if page_obj.has_previous() else None,
        'results': results,
    }, None 