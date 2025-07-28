from django.urls import path
from rest_framework.routers import DefaultRouter
from wallet.views.recipient_wallet import wallet_balance, wallet_transactions, withdraw_funds
from wallet.views.admin_wallet_view import (  # <- FIX import
    AdminWalletOverviewView,
    AdminRecipientWalletListView,
    AdminRecipientWithdrawalsView,
    AdminRecipientTransfersView,
    AdminWalletTransactionListView,
)

app_name = 'wallet'

router = DefaultRouter()

urlpatterns = [
    # Recipient wallet endpoints
    path('balance/', wallet_balance, name='wallet-balance'),
    path('transactions/', wallet_transactions, name='wallet-transactions'),
    path('withdraw/', withdraw_funds, name='wallet-withdraw'),

    # Admin wallet analytics endpoints
    path('admin/overview/', AdminWalletOverviewView.as_view(), name='admin-wallet-overview'),
    path('admin/recipients/', AdminRecipientWalletListView.as_view(), name='admin-recipients'),
    path('admin/recipients/<int:user_id>/withdrawals/', AdminRecipientWithdrawalsView.as_view(), name='admin-recipient-withdrawals'),
    path('admin/recipients/<int:user_id>/transfers/', AdminRecipientTransfersView.as_view(), name='admin-recipient-transfers'),
    path('admin/transactions/', AdminWalletTransactionListView.as_view(), name='admin-wallet-transactions'),
]

urlpatterns += router.urls

