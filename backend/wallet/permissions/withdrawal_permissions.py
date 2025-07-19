from rest_framework.permissions import BasePermission

class IsShuraOrAdmin(BasePermission):
    """
    Allows access only to users with role 'shura' or 'admin'.
    """
    def has_permission(self, request, view):
        user = request.user
        return user and user.is_authenticated and (
            getattr(user, 'role', None) in ['shura', 'admin'] or user.is_superuser
        )
