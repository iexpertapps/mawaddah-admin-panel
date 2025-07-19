from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from wallet.services.wallet_analytics import (
    get_platform_overview,
    get_recipient_wallet_stats,
    get_recipient_withdrawals,
    get_recipient_transfers,
)
from wallet.serializers.admin_wallet import (
    PlatformOverviewSerializer,
    RecipientWalletStatsSerializer,
    WithdrawalHistorySerializer,
    TransferHistorySerializer,
)

class AdminWalletOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request):
        data = get_platform_overview()
        serializer = PlatformOverviewSerializer(data)
        return Response(serializer.data)

class AdminRecipientWalletListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request):
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        stats = get_recipient_wallet_stats(page, page_size)
        serializer = RecipientWalletStatsSerializer(stats['results'], many=True)
        return Response({
            'count': stats['count'],
            'next': stats['next'],
            'previous': stats['previous'],
            'results': serializer.data,
        })

class AdminRecipientWithdrawalsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request, user_id):
        data = get_recipient_withdrawals(user_id)
        if data is None:
            return Response({'detail': 'Recipient not found or invalid role'}, status=status.HTTP_404_NOT_FOUND)
        serializer = WithdrawalHistorySerializer(data, many=True)
        return Response(serializer.data)

class AdminRecipientTransfersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request, user_id):
        data = get_recipient_transfers(user_id)
        if data is None:
            return Response({'detail': 'Recipient not found or invalid role'}, status=status.HTTP_404_NOT_FOUND)
        serializer = TransferHistorySerializer(data, many=True)
        return Response(serializer.data) 