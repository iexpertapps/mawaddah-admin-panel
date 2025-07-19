from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from wallet.models import Wallet, WalletTransaction
from wallet.api.serializers.wallet_serializer import WalletSerializer
from wallet.api.serializers.transaction_serializer import WalletTransactionSerializer
from django.core.paginator import Paginator
from django.db.models import Sum
import json
from wallet.utils import generate_description, resolve_transfer_by

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def wallet_balance(request):
    """Get wallet balance for the authenticated user."""
    try:
        user = request.user
        wallet, created = Wallet.objects.get_or_create(user=user, defaults={'balance': 0})
        
        # Calculate totals
        total_received = WalletTransaction.objects.filter(
            wallet=wallet, 
            type='credit'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_withdrawn = WalletTransaction.objects.filter(
            wallet=wallet, 
            type='debit'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        data = {
            'balance': float(wallet.balance),
            'total_received': float(total_received),
            'total_withdrawn': float(total_withdrawn),
        }
        
        return Response(data)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def wallet_transactions(request):
    """Get wallet transaction history for the authenticated user."""
    try:
        user = request.user
        wallet, created = Wallet.objects.get_or_create(user=user, defaults={'balance': 0})
        
        # Get transactions with pagination
        page = request.GET.get('page', 1)
        page_size = request.GET.get('page_size', 10)
        
        transactions = WalletTransaction.objects.filter(wallet=wallet).order_by('-timestamp')
        
        paginator = Paginator(transactions, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = WalletTransactionSerializer(page_obj, many=True)
        
        data = {
            'results': serializer.data,
            'count': paginator.count,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'num_pages': paginator.num_pages,
            'current_page': page_obj.number,
        }
        
        return Response(data)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw_funds(request):
    """Withdraw funds from wallet."""
    try:
        user = request.user
        data = json.loads(request.body)
        amount = data.get('amount')
        
        if not amount or amount <= 0:
            return Response(
                {'error': 'Invalid amount'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        wallet, created = Wallet.objects.get_or_create(user=user, defaults={'balance': 0})
        
        if wallet.balance < amount:
            return Response(
                {'error': 'Insufficient balance'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create withdrawal transaction
        description = generate_description('withdrawal')
        transfer_by = resolve_transfer_by(user)
        transaction = WalletTransaction.objects.create(
            wallet=wallet,
            type='debit',
            amount=amount,
            description=description,
            transfer_by=transfer_by,
            appeal=None,  # No appeal for withdrawals
            donor=None,   # No donor for withdrawals
        )
        
        # Update wallet balance
        wallet.balance -= amount
        wallet.save()
        
        serializer = WalletTransactionSerializer(transaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
