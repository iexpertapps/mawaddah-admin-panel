from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminOrShura(BasePermission):
    """
    Custom permission: Admins can edit, Shura can view, others forbidden.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role == 'admin':
            return True
        if user.role == 'shura' and request.method in SAFE_METHODS:
            return True
        return False 