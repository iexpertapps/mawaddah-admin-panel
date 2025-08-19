from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet
from users.views.auth import login_view, logout_view, me_view
from users.views.user import AdminProfileView, ChangePasswordView
from django.urls import path
from .views import SendOtpView, VerifyOtpView

app_name = 'users'

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('admin/profile/', AdminProfileView.as_view(), name='admin-profile'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('', include(router.urls)),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', me_view, name='me'),
    path("send-otp/", SendOtpView.as_view(), name="send-otp"),
    path("verify-otp/", VerifyOtpView.as_view(), name="verify-otp"),
] 