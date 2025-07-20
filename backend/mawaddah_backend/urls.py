"""
URL configuration for mawaddah_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
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

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'appeals', AppealViewSet, basename='appeal')
router.register(r'donations', DonationViewSet, basename='donation')

def debug_env(request):
    """Debug endpoint to check environment variables"""
    env_vars = {
        'RAILWAY_ENVIRONMENT': os.environ.get('RAILWAY_ENVIRONMENT', 'NOT_SET'),
        'RAILWAY_PROJECT_ID': os.environ.get('RAILWAY_PROJECT_ID', 'NOT_SET'),
        'RAILWAY_SERVICE_ID': os.environ.get('RAILWAY_SERVICE_ID', 'NOT_SET'),
        'DEBUG': os.environ.get('DEBUG', 'NOT_SET'),
        'DJANGO_DEBUG': os.environ.get('DJANGO_DEBUG', 'NOT_SET'),
        'ALL_ENV_KEYS': list(os.environ.keys())
    }
    return JsonResponse(env_vars)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/admin/profile/', AdminProfileView.as_view(), name='admin-profile'),
    path('api/', include(router.urls)),
    path('api/', include('users.urls')),
    path('api/', include('appeals.urls')),
    path('api/', include('donations.urls')),
    path('api/', include('wallet.urls')),
    path('api/wallet/stats/', WalletStatsView.as_view(), name='wallet-stats'),
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/dashboard/recent-activity/', RecentActivityView.as_view(), name='recent-activity'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/settings/', include('settings.urls')),
    path('api/debug/env/', debug_env, name='debug_env'),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
