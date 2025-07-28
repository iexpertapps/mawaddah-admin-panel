from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet
from appeals.views import AppealViewSet
from donations.views import DonationViewSet
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from wallet.views.dashboard import DashboardStatsView, ShuraSummaryView, RecentActivityView, WalletStatsView
from users.views.user import AdminProfileView
from django.http import JsonResponse
import os
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'appeals', AppealViewSet, basename='appeal')
router.register(r'donations', DonationViewSet, basename='donation')


def debug_env(request):
    env_vars = {
        'RAILWAY_ENVIRONMENT': os.environ.get('RAILWAY_ENVIRONMENT', 'NOT_SET'),
        'RAILWAY_PROJECT_ID': os.environ.get('RAILWAY_PROJECT_ID', 'NOT_SET'),
        'RAILWAY_SERVICE_ID': os.environ.get('RAILWAY_SERVICE_ID', 'NOT_SET'),
        'DEBUG': os.environ.get('DEBUG', 'NOT_SET'),
        'DJANGO_DEBUG': os.environ.get('DJANGO_DEBUG', 'NOT_SET'),
        'ALL_ENV_KEYS': list(os.environ.keys())
    }
    return JsonResponse(env_vars)


@permission_classes([AllowAny])
def health_check(request):
    return JsonResponse({'status': 'healthy', 'message': 'Django app is running'})


@permission_classes([AllowAny])
def root_view(request):
    return JsonResponse({"status": "Mawaddah API is Live", "version": "1.0"})


urlpatterns = [
    # Health checks
    path('api/health', health_check, name='api_health_no_slash'),
    path('api/health/', health_check, name='api_health_slash'),
    path('', health_check, name='root-health-check'),

    # Django admin
    path('admin/', admin.site.urls),

    # Admin profile endpoint
    path('api/admin/profile/', AdminProfileView.as_view(), name='admin-profile'),

    # DRF routers
    path('api/', include(router.urls)),

    # App URLs
    path('api/', include('users.urls')),
    path('api/', include('appeals.urls')),
    path('api/', include('donations.urls')),
    path('api/wallet/', include('wallet.urls', namespace='wallet')),

    # Dashboard & analytics
    path('api/wallet/stats/', WalletStatsView.as_view(), name='wallet-stats'),
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/dashboard/recent-activity/', RecentActivityView.as_view(), name='recent-activity'),

    # API docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Settings app
    path('api/settings/', include('settings.urls')),

    # Debugging
    path('api/debug/env/', debug_env, name='debug_env'),
]

# Serve static and media files in development OR Railway
if settings.DEBUG or os.environ.get("RAILWAY_ENVIRONMENT") == "production":
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

