from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.models import User
from donations.models import Donation
from appeals.models import Appeal
from wallet.models import WalletTransaction
from django.utils import timezone
from django.db.models import Count, Avg, Q, F, Sum
from datetime import timedelta
import logging

class IsAdminOnly(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and (getattr(request.user, 'role', None) == 'admin' or request.user.is_superuser)

class DashboardStatsView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request):
        now = timezone.now()
        period = request.GET.get('period', '30')
        
        # Calculate date range based on period
        if period == '7':
            start_date = now - timedelta(days=7)
        elif period == '30':
            start_date = now - timedelta(days=30)
        elif period == '90':
            start_date = now - timedelta(days=90)
        else:
            start_date = now - timedelta(days=30)

        # Total donations
        total_donations = Donation.objects.filter(
            created_at__gte=start_date
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Active appeals
        active_appeals = Appeal.objects.filter(status='active').count()

        # Registered users
        total_users = User.objects.count()

        # Wallet balance (sum of all user wallets)
        total_wallet_balance = User.objects.aggregate(
            total=Sum('wallet_balance')
        )['total'] or 0

        # Recent activity
        recent_donations = Donation.objects.filter(
            created_at__gte=start_date
        ).order_by('-created_at')[:5]

        recent_appeals = Appeal.objects.filter(
            created_at__gte=start_date
        ).order_by('-created_at')[:5]

        recent_users = User.objects.filter(
            date_joined__gte=start_date
        ).order_by('-date_joined')[:5]

        recent_withdrawals = WalletTransaction.objects.filter(
            type='debit',
            created_at__gte=start_date
        ).order_by('-timestamp')[:5]

        # Format activity data
        activities = []
        
        for donation in recent_donations:
            activities.append({
                'type': 'donation',
                'message': f'New donation of ${donation.amount} received from {donation.donor.full_name if donation.donor else "Anonymous"}',
                'time': donation.created_at,
                'amount': f'+${donation.amount}'
            })

        for appeal in recent_appeals:
            activities.append({
                'type': 'appeal',
                'message': f'Appeal "{appeal.title}" was {appeal.status}',
                'time': appeal.created_at,
                'amount': f'-${appeal.amount_requested}' if appeal.amount_requested else ''
            })

        for user in recent_users:
            activities.append({
                'type': 'user',
                'message': f'New user {user.full_name} registered',
                'time': user.date_joined,
                'amount': ''
            })

        for withdrawal in recent_withdrawals:
            activities.append({
                'type': 'withdrawal',
                'message': f'Withdrawal processed for ${withdrawal.amount}',
                'time': withdrawal.created_at,
                'amount': f'-${withdrawal.amount}'
            })

        # Sort activities by time (most recent first)
        activities.sort(key=lambda x: x['time'], reverse=True)
        activities = activities[:10]  # Limit to 10 most recent

        return Response({
            'stats': {
                'total_donations': total_donations,
                'active_appeals': active_appeals,
                'registered_users': total_users,
                'wallet_balance': total_wallet_balance
            },
            'activities': activities,
            'period': period
        })

class ShuraSummaryView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request):
        now = timezone.now()
        # Total debit transactions (withdrawals)
        total_withdrawals = WalletTransaction.objects.filter(type='debit').count()
        # Average processing time (in hours) - using created_at for now
        recent_withdrawals = WalletTransaction.objects.filter(
            type='debit',
            created_at__isnull=False
        )
        avg_processing_time = recent_withdrawals.aggregate(
            avg=Avg('created_at')
        )['avg']
        avg_processing_time_hours = None
        if avg_processing_time:
            # This is a simplified calculation
            avg_processing_time_hours = 24  # Default to 24 hours for now
        
        # Total withdrawals this month
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        total_withdrawals_this_month = WalletTransaction.objects.filter(
            type='debit',
            created_at__gte=start_of_month
        ).count()
        
        return Response({
            'total_withdrawals': total_withdrawals,
            'avg_processing_time_hours': avg_processing_time_hours,
            'total_withdrawals_this_month': total_withdrawals_this_month,
        })

class RecentActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get recent activity for the dashboard"""
        from datetime import timedelta
        from django.utils import timezone
        logger = logging.getLogger(__name__)
        try:
            now = timezone.now()
            start_date = now - timedelta(days=7)  # Last 7 days
            activities = []
            # Recent donations
            try:
                recent_donations = Donation.objects.filter(
                    created_at__gte=start_date
                ).order_by('-created_at')[:5]
                for donation in recent_donations:
                    donor_name = getattr(donation, 'donor', None)
                    donor_full_name = getattr(donor_name, 'full_name', 'Anonymous') if donor_name else 'Anonymous'
                    activities.append({
                        'id': f'donation_{donation.id}',
                        'type': 'donation',
                        'title': f'New donation received',
                        'message': f'${donation.amount} from {donor_full_name}',
                        'user': donor_full_name,
                        'timestamp': donation.created_at.isoformat() if donation.created_at else '',
                        'amount': donation.amount
                    })
            except Exception as e:
                logger.error(f"Error fetching donations: {e}")
            # Recent appeals
            try:
                recent_appeals = Appeal.objects.filter(
                    created_at__gte=start_date
                ).order_by('-created_at')[:5]
                for appeal in recent_appeals:
                    created_by = getattr(appeal, 'created_by', None)
                    created_by_name = getattr(created_by, 'full_name', 'Unknown') if created_by else 'Unknown'
                    activities.append({
                        'id': f'appeal_{appeal.id}',
                        'type': 'appeal',
                        'title': f'Appeal {appeal.status}',
                        'message': f'"{appeal.title}" was {appeal.status}',
                        'user': created_by_name,
                        'timestamp': appeal.created_at.isoformat() if appeal.created_at else '',
                        'amount': getattr(appeal, 'amount_requested', None)
                    })
            except Exception as e:
                logger.error(f"Error fetching appeals: {e}")
            # Recent users
            try:
                recent_users = User.objects.filter(
                    date_joined__gte=start_date
                ).order_by('-date_joined')[:5]
                for user in recent_users:
                    activities.append({
                        'id': f'user_{user.id}',
                        'type': 'user',
                        'title': f'New user registered',
                        'message': f'{user.full_name} joined the platform',
                        'user': user.full_name,
                        'timestamp': user.date_joined.isoformat() if user.date_joined else '',
                        'amount': None
                    })
            except Exception as e:
                logger.error(f"Error fetching users: {e}")
            # Recent withdrawals
            try:
                recent_withdrawals = WalletTransaction.objects.filter(
                    type='debit',
                    created_at__gte=start_date
                ).order_by('-timestamp')[:5]
                for withdrawal in recent_withdrawals:
                    user = getattr(withdrawal, 'wallet', None)
                    user_name = getattr(user, 'user', None)
                    user_full_name = getattr(user_name, 'full_name', 'Unknown') if user_name else 'Unknown'
                    activities.append({
                        'id': f'withdrawal_{withdrawal.id}',
                        'type': 'withdrawal',
                        'title': f'Withdrawal processed',
                        'message': f'${withdrawal.amount} withdrawal processed',
                        'user': user_full_name,
                        'timestamp': withdrawal.created_at.isoformat() if withdrawal.created_at else '',
                        'amount': withdrawal.amount
                    })
            except Exception as e:
                logger.error(f"Error fetching withdrawals: {e}")
            # Sort activities by timestamp (most recent first)
            activities = [a for a in activities if a.get('timestamp')]
            activities.sort(key=lambda x: x['timestamp'], reverse=True)
            activities = activities[:10]  # Limit to 10 most recent
            return Response({
                'activities': activities
            })
        except Exception as e:
            logger.error(f"Error in RecentActivityView: {e}")
            return Response({'activities': []}, status=200)

class WalletStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get wallet statistics for the current user"""
        user = request.user
        
        # Get user's wallet
        try:
            wallet = user.wallet
        except:
            return Response({'error': 'Wallet not found'}, status=404)
        
        # Get recent transactions
        recent_transactions = WalletTransaction.objects.filter(
            wallet=wallet
        ).order_by('-timestamp')[:10]
        
        # Calculate stats
        total_credited = WalletTransaction.objects.filter(
            wallet=wallet,
            type='credit'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_withdrawn = WalletTransaction.objects.filter(
            wallet=wallet,
            type='debit'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'wallet_balance': float(wallet.balance),
            'total_credited': float(total_credited),
            'total_withdrawn': float(total_withdrawn),
            'recent_transactions': [
                {
                    'id': transaction.id,
                    'type': transaction.type,
                    'amount': float(transaction.amount),
                    'description': transaction.description,
                    'created_at': transaction.created_at.isoformat(),
                }
                for transaction in recent_transactions
            ]
        })
