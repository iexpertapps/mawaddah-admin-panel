from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from wallet.services.wallet_analytics import (
    get_platform_overview,
    get_recipient_wallet_stats,
    get_recipient_withdrawals,
    get_recipient_transfers,
    get_admin_transactions,
)
from wallet.serializers.admin_wallet import (
    PlatformOverviewSerializer,
    RecipientWalletStatsSerializer,
    WithdrawalHistorySerializer,
    TransferHistorySerializer,
    AdminWalletTransactionSerializer,
)

class AdminWalletOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request):
        data, error = get_platform_overview()
        return Response(data)

class AdminRecipientWalletListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request):
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        result, error = get_recipient_wallet_stats(page=page, page_size=page_size)
        if error:
            return Response({'detail': error}, status=status.HTTP_404_NOT_FOUND)
        return Response(result)

class AdminRecipientWithdrawalsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request, user_id):
        data, error = get_recipient_withdrawals(user_id)
        if error:
            return Response({'detail': error}, status=status.HTTP_404_NOT_FOUND)
        return Response(data)

class AdminRecipientTransfersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request, user_id):
        data, error = get_recipient_transfers(user_id)
        if error:
            return Response({'detail': error}, status=status.HTTP_404_NOT_FOUND)
        return Response(data)

class AdminWalletTransactionListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request):
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        search = request.GET.get('search', None)
        result, error = get_admin_transactions(page=page, page_size=page_size, search=search)
        if error:
            return Response({'detail': error}, status=status.HTTP_404_NOT_FOUND)
        return Response(result) 