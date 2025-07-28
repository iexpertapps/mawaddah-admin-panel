import logging
from datetime import timedelta

from django.utils import timezone
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response

from users.models import User
from donations.models import Donation
from appeals.models import Appeal
from wallet.models import Wallet, WalletTransaction

logger = logging.getLogger(__name__)


# ---------------- Permissions ----------------

class IsAdminOnly(BasePermission):
    """
    Allows access only to admin or superuser users.
    """
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (getattr(request.user, "role", None) == "admin" or request.user.is_superuser)
        )


# ---------------- Helpers ----------------

def get_recent_activities(start_date):
    """
    Return consolidated recent activities: donations, appeals, users, and withdrawals.
    Safely handles missing/null fields.
    """
    activities = []

    # Donations
    for donation in Donation.objects.filter(created_at__gte=start_date).order_by("-created_at")[:5]:
        donor_name = getattr(donation.donor, "full_name", "Anonymous") if donation.donor else "Anonymous"
        activities.append({
            "id": f"donation_{donation.id}",
            "type": "donation",
            "title": "New donation received",
            "message": f"${donation.amount} from {donor_name}",
            "user": donor_name,
            "timestamp": donation.created_at.isoformat() if donation.created_at else None,
            "amount": float(donation.amount),
        })

    # Appeals
    for appeal in Appeal.objects.filter(created_at__gte=start_date).order_by("-created_at")[:5]:
        created_by_name = getattr(appeal.created_by, "full_name", "Unknown") if appeal.created_by else "Unknown"
        activities.append({
            "id": f"appeal_{appeal.id}",
            "type": "appeal",
            "title": f"Appeal {getattr(appeal, 'status', 'Unknown')}",
            "message": f"\"{getattr(appeal, 'title', 'Unknown')}\" was {getattr(appeal, 'status', 'Unknown')}",
            "user": created_by_name,
            "timestamp": appeal.created_at.isoformat() if appeal.created_at else None,
            "amount": float(appeal.amount_requested) if getattr(appeal, "amount_requested", None) else None,
        })

    # Users
    for user in User.objects.filter(date_joined__gte=start_date).order_by("-date_joined")[:5]:
        full_name = getattr(user, "full_name", user.email)
        activities.append({
            "id": f"user_{user.id}",
            "type": "user",
            "title": "New user registered",
            "message": f"{full_name} joined the platform",
            "user": full_name,
            "timestamp": user.date_joined.isoformat() if user.date_joined else None,
            "amount": None,
        })

    # Withdrawals (FIX: use timestamp field)
    for withdrawal in WalletTransaction.objects.filter(type="debit", timestamp__gte=start_date).order_by("-timestamp")[:5]:
        user_full_name = (
            getattr(withdrawal.wallet.user, "full_name", "Unknown")
            if withdrawal.wallet and withdrawal.wallet.user
            else "Unknown"
        )
        activities.append({
            "id": f"withdrawal_{withdrawal.id}",
            "type": "withdrawal",
            "title": "Withdrawal processed",
            "message": f"${withdrawal.amount} withdrawal processed",
            "user": user_full_name,
            "timestamp": withdrawal.timestamp.isoformat() if withdrawal.timestamp else None,
            "amount": float(withdrawal.amount),
        })

    # Filter out any missing timestamps and sort by newest
    activities = [a for a in activities if a.get("timestamp")]
    activities = sorted(activities, key=lambda x: x["timestamp"], reverse=True)[:10]
    return activities


# ---------------- Views ----------------

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Return overall dashboard statistics and recent activities.
        """
        try:
            now = timezone.now()
            period = request.GET.get("period", "30")

            # Determine date range
            days_map = {"7": 7, "30": 30, "90": 90}
            start_date = now - timedelta(days=days_map.get(period, 30))

            # Stats
            total_donations = Donation.objects.filter(created_at__gte=start_date).aggregate(
                total=Sum("amount")
            )["total"] or 0

            active_appeals = Appeal.objects.filter(status="active").count()
            total_users = User.objects.count()

            # FIX: use Wallet model for total balance instead of User.wallet_balance
            total_wallet_balance = Wallet.objects.aggregate(
                total=Sum("balance")
            )["total"] or 0

            activities = get_recent_activities(start_date)

            return Response({
                "stats": {
                    "total_donations": total_donations,
                    "active_appeals": active_appeals,
                    "registered_users": total_users,
                    "wallet_balance": total_wallet_balance,
                },
                "activities": activities,
                "period": period,
            })

        except Exception as e:
            import traceback
            logger.exception("Error in DashboardStatsView.get")
            return Response({
                "detail": str(e),
                "trace": traceback.format_exc()
            }, status=500)


class ShuraSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Return summary for Shura: withdrawals and processing time.
        """
        now = timezone.now()
        try:
            total_withdrawals = WalletTransaction.objects.filter(type="debit").count()

            # FIX: use timestamp instead of created_at
            recent_withdrawals = WalletTransaction.objects.filter(type="debit", timestamp__isnull=False)
            avg_processing_time_hours = 24 if recent_withdrawals.exists() else None  # Placeholder

            start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            total_withdrawals_this_month = WalletTransaction.objects.filter(
                type="debit", timestamp__gte=start_of_month
            ).count()

            return Response({
                "total_withdrawals": total_withdrawals,
                "avg_processing_time_hours": avg_processing_time_hours,
                "total_withdrawals_this_month": total_withdrawals_this_month,
            })
        except Exception as e:
            logger.exception("Error in ShuraSummaryView.get")
            return Response({"detail": str(e)}, status=500)


class RecentActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Return recent activities (last 7 days).
        """
        start_date = timezone.now() - timedelta(days=7)
        try:
            activities = get_recent_activities(start_date)
            return Response({"activities": activities})
        except Exception as e:
            logger.exception("Error in RecentActivityView.get")
            return Response({"activities": [], "detail": str(e)}, status=500)


class WalletStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Return wallet stats for the current user.
        """
        user = request.user
        try:
            wallet = getattr(user, "wallet", None)
            if not wallet:
                return Response({"error": "Wallet not found"}, status=404)

            # FIX: order by timestamp instead of created_at
            recent_transactions = WalletTransaction.objects.filter(wallet=wallet).order_by("-timestamp")[:10]

            total_credited = WalletTransaction.objects.filter(wallet=wallet, type="credit").aggregate(
                total=Sum("amount")
            )["total"] or 0

            total_withdrawn = WalletTransaction.objects.filter(wallet=wallet, type="debit").aggregate(
                total=Sum("amount")
            )["total"] or 0

            return Response({
                "wallet_balance": float(wallet.balance),
                "total_credited": float(total_credited),
                "total_withdrawn": float(total_withdrawn),
                "recent_transactions": [
                    {
                        "id": transaction.id,
                        "type": transaction.type,
                        "amount": float(transaction.amount),
                        "description": transaction.description,
                        "timestamp": transaction.timestamp.isoformat() if transaction.timestamp else None,
                    }
                    for transaction in recent_transactions
                ]
            })
        except Exception as e:
            logger.exception("Error in WalletStatsView.get")
            return Response({"detail": str(e)}, status=500)
