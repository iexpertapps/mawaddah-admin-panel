from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.pagination import PageNumberPagination
from wallet.models import Wallet, WalletTransaction
from wallet.api.serializers.wallet_serializer import WalletSerializer
from wallet.api.serializers.transaction_serializer import WalletTransactionSerializer
from wallet.api.permissions import IsRecipient

class WalletView(APIView):
    permission_classes = [IsRecipient]

    def get(self, request):
        wallet = getattr(request.user, 'wallet', None)
        if not wallet:
            return Response({'error': 'Wallet not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)

class WalletTransactionListView(generics.ListAPIView):
    permission_classes = [IsRecipient]
    serializer_class = WalletTransactionSerializer
    pagination_class = PageNumberPagination

    def get_queryset(self):
        wallet = getattr(self.request.user, 'wallet', None)
        if not wallet:
            return WalletTransaction.objects.none()
        return wallet.transactions.all().order_by('-timestamp')

class WalletWithdrawView(APIView):
    permission_classes = [IsRecipient]

    def post(self, request):
        # This should be replaced with direct wallet withdrawal logic
        return Response({'error': 'Direct withdrawal endpoint not implemented.'}, status=status.HTTP_501_NOT_IMPLEMENTED) 