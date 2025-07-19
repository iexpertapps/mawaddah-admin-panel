from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsDonorOrAdmin(BasePermission):
    """
    Only donor users can create, admin can read all.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or getattr(user, 'role', None) == 'admin':
            return True
        if view.action == 'create':
            return getattr(user, 'role', None) == 'donor'
        return True

class IsOwner(BasePermission):
    """
    Donors can see only their own donations.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or getattr(user, 'role', None) == 'admin':
            return True
        return obj.donor == user

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return user and user.is_authenticated and (user.is_superuser or getattr(user, 'role', None) == 'admin')
