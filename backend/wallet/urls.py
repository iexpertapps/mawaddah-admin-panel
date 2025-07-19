from django.urls import path, include
from rest_framework.routers import DefaultRouter
from wallet.views.recipient_wallet import wallet_balance, wallet_transactions, withdraw_funds

app_name = 'wallet'

router = DefaultRouter()

urlpatterns = [
    path('balance/', wallet_balance, name='wallet-balance'),
    path('transactions/', wallet_transactions, name='wallet-transactions'),
    path('withdraw/', withdraw_funds, name='wallet-withdraw'),
    path('', include('wallet.api.urls')),
]

urlpatterns += router.urls 