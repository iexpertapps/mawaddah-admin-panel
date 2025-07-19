from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsVerifiedRecipientOrShura(BasePermission):
    """
    Only verified Sadaat (is_verified_syed=True) or Shura members can create appeals.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.role == 'admin':
            return True
        return (getattr(user, 'is_verified_syed', False) and user.role == 'recipient') or user.role == 'shura'

class IsShuraApprover(BasePermission):
    """
    Only Shura members (or admin) can approve, reject, or mark as urgent.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.is_superuser or user.role in ['admin', 'shura']

class IsOwnerOrReadOnly(BasePermission):
    """
    Users can view their own appeals and read-only on others. Admins have full access.
    """
    def has_object_permission(self, request, view, obj, *args, **kwargs):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.role == 'admin':
            return True
        if request.method in SAFE_METHODS:
            return True
        return obj.created_by == user
