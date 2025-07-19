from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SettingsViewSet

settings_list = SettingsViewSet.as_view({'get': 'list', 'patch': 'partial_update'})

urlpatterns = [
    path('', settings_list, name='settings-list'),
] 