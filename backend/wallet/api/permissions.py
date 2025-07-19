from rest_framework.permissions import BasePermission, IsAuthenticated
from users.utils.role_check import is_admin, is_shura, is_recipient

class IsRecipient(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and is_recipient(request.user)

class IsAdminOrShuraUser(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (is_admin(request.user) or is_shura(request.user)) 