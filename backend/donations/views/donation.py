from rest_framework import viewsets, mixins, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import datetime
from donations.models import Donation
from donations.serializers.donation import DonationSerializer
from donations.permissions.donation_permissions import IsDonorOrAdmin, IsOwner

class DonationViewSet(mixins.CreateModelMixin,
                      mixins.ListModelMixin,
                      mixins.RetrieveModelMixin,
                      viewsets.GenericViewSet):
    queryset = Donation.objects.all().select_related('donor', 'appeal')
    serializer_class = DonationSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        # Exclude only manual and null payment_method donations
        queryset = queryset.exclude(payment_method='manual').exclude(payment_method__isnull=True)
        
        # Handle unauthenticated users
        if not user.is_authenticated:
            return queryset.none()  # Return empty queryset for unauthenticated users
        
        # Admin can see all donations with filtering
        if user.is_superuser or getattr(user, 'role', None) == 'admin':
            # Apply filters
            search = self.request.query_params.get('search', '')
            payment_method = self.request.query_params.get('payment_method', '')
            appeal_linked = self.request.query_params.get('appeal_linked', '')
            date_from = self.request.query_params.get('date_from', '')
            date_to = self.request.query_params.get('date_to', '')
            
            if search:
                queryset = queryset.filter(
                    Q(donor__name__icontains=search) |
                    Q(transaction_id__icontains=search)
                )
            
            if payment_method:
                queryset = queryset.filter(payment_method=payment_method)
            
            if appeal_linked == 'true':
                queryset = queryset.filter(appeal__isnull=False)
            elif appeal_linked == 'false':
                queryset = queryset.filter(appeal__isnull=True)
            
            if date_from:
                try:
                    date_from_obj = datetime.strptime(str(date_from), '%Y-%m-%d').date()
                    queryset = queryset.filter(created_at__date__gte=date_from_obj)
                except ValueError:
                    pass
            
            if date_to:
                try:
                    date_to_obj = datetime.strptime(str(date_to), '%Y-%m-%d').date()
                    queryset = queryset.filter(created_at__date__lte=date_to_obj)
                except ValueError:
                    pass
            
            return queryset
        else:
            # Non-admin users can only see their own donations
            return queryset.filter(donor=user)

    def get_permissions(self):
        return [AllowAny()]

    def perform_create(self, serializer):
        if not self.request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        serializer.save(donor=self.request.user)

    def list(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        user = request.user
        
        # Only admin can access with meta stats
        if not (user.is_superuser or getattr(user, 'role', None) == 'admin'):
            return super().list(request, *args, **kwargs)
        
        queryset = self.get_queryset()
        
        # Calculate meta stats for admin, excluding manual donations
        total_amount = queryset.aggregate(total=Sum('amount'))['total'] or 0
        via_bank = queryset.filter(payment_method='bank_transfer').aggregate(total=Sum('amount'))['total'] or 0
        via_jazzcash = queryset.filter(payment_method='jazzcash').aggregate(total=Sum('amount'))['total'] or 0
        via_easypaisa = queryset.filter(payment_method='easypaisa').aggregate(total=Sum('amount'))['total'] or 0
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page if page is not None else queryset, many=True)
        
        # If paginated, get the paginated response and inject meta
        if page is not None:
            response_data = self.get_paginated_response(serializer.data)
            response_data.data['meta'] = {
                'total_amount': float(total_amount),
                'via_bank': float(via_bank),
                'via_jazzcash': float(via_jazzcash),
                'via_easypaisa': float(via_easypaisa),
            }
            return response_data
        # If not paginated (e.g. page=all), return meta in the response
        return Response({
            'count': queryset.count(),
            'results': serializer.data,
            'meta': {
                'total_amount': float(total_amount),
                'via_bank': float(via_bank),
                'via_jazzcash': float(via_jazzcash),
                'via_easypaisa': float(via_easypaisa),
            }
        })
