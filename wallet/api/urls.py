from django.urls import path
from wallet.views.admin_wallet_view import (
    AdminWalletOverviewView,
    AdminRecipientWalletListView,
    AdminRecipientWithdrawalsView,
    AdminRecipientTransfersView,
)

urlpatterns = [
    path('admin/overview/', AdminWalletOverviewView.as_view()),
    path('admin/recipients/', AdminRecipientWalletListView.as_view()),
    path('admin/recipients/<int:user_id>/withdrawals/', AdminRecipientWithdrawalsView.as_view()),
    path('admin/recipients/<int:user_id>/transfers/', AdminRecipientTransfersView.as_view()),
] 