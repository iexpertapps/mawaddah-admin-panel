from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminOrOwnerOrReadOnly(BasePermission):
    """
    Custom permission to only allow users to edit their own profile, or admins to edit any user.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in SAFE_METHODS:
            return True
        # Write permissions are allowed to the user themselves or to admins.
        return obj == request.user or (hasattr(request.user, 'role') and request.user.role == 'admin')

# Placeholders for future role-based permissions
class IsDonor(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'role') and request.user.role == 'donor'

class IsShura(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'role') and request.user.role == 'shura'

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'role') and request.user.role == 'admin' 