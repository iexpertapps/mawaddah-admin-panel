from django.urls import path, include
from rest_framework.routers import DefaultRouter
from donations.views import DonationViewSet

app_name = 'donations'

router = DefaultRouter()
router.register(r'donations', DonationViewSet, basename='donation')

urlpatterns = [
    path('', include(router.urls)),
] 