from django.urls import path
from wallet.api.views.wallet_view import WalletView, WalletTransactionListView, WalletWithdrawView
from wallet.views.admin_wallet_view import (
    AdminWalletOverviewView,
    AdminRecipientWalletListView,
    AdminRecipientWithdrawalsView,
    AdminRecipientTransfersView,
    AdminWalletTransactionListView,
)

urlpatterns = [
    # Recipient endpoints
    path('wallet/', WalletView.as_view(), name='wallet-info'),
    path('transactions/', WalletTransactionListView.as_view(), name='wallet-transactions'),
    path('withdraw/', WalletWithdrawView.as_view(), name='wallet-withdraw'),
    # Admin analytics endpoints
    path('admin/overview/', AdminWalletOverviewView.as_view()),
    path('admin/recipients/', AdminRecipientWalletListView.as_view()),
    path('admin/recipients/<int:user_id>/withdrawals/', AdminRecipientWithdrawalsView.as_view()),
    path('admin/recipients/<int:user_id>/transfers/', AdminRecipientTransfersView.as_view()),
    path('admin/transactions/', AdminWalletTransactionListView.as_view()),
] 