from django.db.models import Sum, Q
from users.models import User
from wallet.models import Wallet, WalletTransaction
from django.core.paginator import Paginator
from django.utils import timezone

def get_platform_overview():
    total_withdrawn = WalletTransaction.objects.filter(type='debit').aggregate(total=Sum('amount'))['total'] or 0
    total_balance = Wallet.objects.aggregate(total=Sum('balance'))['total'] or 0
    return {
        'total_withdrawn_amount': total_withdrawn,
        'total_current_balance': total_balance,
    }

def get_recipient_wallet_stats(page=1, page_size=10):
    recipients = User.objects.filter(role='recipient').order_by('id')
    paginator = Paginator(recipients, page_size)
    page_obj = paginator.get_page(page)
    results = []
    for user in page_obj.object_list:
        total_received = WalletTransaction.objects.filter(wallet__user=user, type='credit').aggregate(total=Sum('amount'))['total'] or 0
        total_withdrawn = WalletTransaction.objects.filter(wallet__user=user, type='debit').aggregate(total=Sum('amount'))['total'] or 0
        current_balance = total_received - total_withdrawn
        results.append({
            'id': user.id,
            'name': user.get_full_name() or user.email,
            'email': user.email,
            'total_received': total_received,
            'total_withdrawn': total_withdrawn,
            'current_balance': current_balance,
        })
    # Sort by current_balance descending
    results = sorted(results, key=lambda x: x['current_balance'], reverse=True)
    return {
        'count': paginator.count,
        'next': page_obj.has_next(),
        'previous': page_obj.has_previous(),
        'results': results,
    }

def get_recipient_withdrawals(user_id):
    user = User.objects.filter(id=user_id, role='recipient').first()
    if not user:
        return None
    withdrawals = WalletTransaction.objects.filter(wallet__user=user, type='debit').order_by('-timestamp')
    return [
        {'date': w.timestamp.date().isoformat(), 'amount': w.amount} for w in withdrawals
    ]

def get_recipient_transfers(user_id):
    user = User.objects.filter(id=user_id, role='recipient').first()
    if not user:
        return None
    transfers = WalletTransaction.objects.filter(wallet__user=user, type='credit').order_by('-timestamp')
    result = []
    for t in transfers:
        if t.donor:
            transferred_by = t.donor.get_full_name() or t.donor.email
        else:
            transferred_by = 'System'
        result.append({
            'date': t.timestamp.date().isoformat(),
            'amount': t.amount,
            'transferred_by': transferred_by,
        })
    return result 