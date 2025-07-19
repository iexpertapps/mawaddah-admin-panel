from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count
from appeals.models import Appeal
from appeals.serializers.appeal import AppealListSerializer, AppealDetailSerializer
from appeals.permissions.appeal_permissions import (
    IsVerifiedRecipientOrShura, IsShuraApprover, IsOwnerOrReadOnly
)
from rest_framework import serializers

class AppealViewSet(mixins.ListModelMixin,
                    mixins.RetrieveModelMixin,
                    mixins.CreateModelMixin,
                    mixins.UpdateModelMixin,
                    viewsets.GenericViewSet):
    queryset = Appeal.objects.all().select_related(
        'created_by', 'beneficiary', 'approved_by', 'rejected_by', 'cancelled_by',
        'linked_donation', 'linked_donation__donor'
    )
    serializer_class = AppealListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Add search and filtering support."""
        queryset = Appeal.objects.all().select_related(
            'created_by', 'beneficiary', 'approved_by', 'rejected_by', 'cancelled_by',
            'linked_donation', 'linked_donation__donor'
        )
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(beneficiary__first_name__icontains=search) |
                Q(beneficiary__last_name__icontains=search) |
                Q(beneficiary__email__icontains=search)
            )
        
        # Status filter
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Category filter
        category_filter = self.request.query_params.get('category', None)
        if category_filter:
            queryset = queryset.filter(category=category_filter)
        
        return queryset.order_by('-created_at')

    def get_filtered_stats(self, queryset):
        """Calculate stats for the filtered queryset."""
        stats = queryset.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            approved=Count('id', filter=Q(status='approved')),
            rejected=Count('id', filter=Q(status='rejected')),
            cancelled=Count('id', filter=Q(status='cancelled')),
            fulfilled=Count('id', filter=Q(status='fulfilled')),
            expired=Count('id', filter=Q(status='expired'))
        )
        return stats

    def list(self, request, *args, **kwargs):
        """Enhanced list method with filtered stats."""
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            
            # Add filtered stats to response
            filtered_stats = self.get_filtered_stats(queryset)
            response.data['filtered_stats'] = filtered_stats
            
            return response
        
        serializer = self.get_serializer(queryset, many=True)
        response = Response(serializer.data)
        
        # Add filtered stats to response
        filtered_stats = self.get_filtered_stats(queryset)
        response.data = {
            'results': serializer.data,
            'filtered_stats': filtered_stats
        }
        
        return response

    def get_serializer_class(self):
        """Use detail serializer for retrieve actions."""
        if self.action == 'retrieve':
            return AppealDetailSerializer
        return AppealListSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsVerifiedRecipientOrShura()]
        if self.action in ['partial_update', 'update']:
            return [IsAuthenticated(), IsShuraApprover()]
        if self.action in ['my_appeals']:
            return [IsAuthenticated()]
        if self.action in ['reviewable']:
            return [IsAuthenticated(), IsShuraApprover()]
        return [IsAuthenticated(), IsOwnerOrReadOnly()]

    def perform_create(self, serializer):
        user = self.request.user
        beneficiary = serializer.validated_data.get('beneficiary')
        if user.role == 'shura' and beneficiary:
            serializer.save(created_by=user, beneficiary=beneficiary)
        else:
            serializer.save(created_by=user, beneficiary=user)

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        new_status = serializer.validated_data.get('status', old_status)
        user = self.request.user
        rejection_reason = serializer.validated_data.get('rejection_reason', None)

        # Track action based on status change
        if new_status != old_status:
            if new_status == 'approved':
                serializer.save(
                    status='approved',
                    approved_by=user,
                    approved_at=timezone.now()
                )
            elif new_status == 'rejected':
                if not rejection_reason:
                    raise serializers.ValidationError({'rejection_reason': 'Rejection reason is required.'})
                serializer.save(
                    status='rejected',
                    rejected_by=user,
                    rejected_at=timezone.now(),
                    rejection_reason=rejection_reason
                )
            elif new_status == 'cancelled':
                serializer.save(
                    status='cancelled',
                    cancelled_by=user,
                    cancelled_at=timezone.now()
                )
            else:
                serializer.save()
        else:
            serializer.save()
        instance.refresh_from_db()

    @action(detail=False, methods=['get'], url_path='my-appeals')
    def my_appeals(self, request):
        """List appeals created by the current user."""
        queryset = Appeal.objects.filter(created_by=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='reviewable')
    def reviewable(self, request):
        """List appeals visible to Shura for review (pending)."""
        queryset = Appeal.objects.filter(status='pending')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Return global stats for all appeals (not filtered)."""
        queryset = Appeal.objects.all()
        stats = self.get_filtered_stats(queryset)
        return Response(stats)
