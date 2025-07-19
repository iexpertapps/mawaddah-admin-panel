from django.urls import path, include
from rest_framework.routers import DefaultRouter
from appeals.views import AppealViewSet

app_name = 'appeals'

router = DefaultRouter()
router.register(r'appeals', AppealViewSet, basename='appeal')

urlpatterns = [
    path('', include(router.urls)),
] 