from rest_framework import viewsets, mixins, status, permissions
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction

from users.models import User
from users.serializers import UserSerializer, UserCreateSerializer
from users.permissions.user_permissions import IsAdminOrOwnerOrReadOnly, IsAdmin
from users.serializers.user import AdminProfileSerializer

class CustomPageNumberPagination(PageNumberPagination):
    """
    Custom pagination class that properly handles page_size parameter.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class UserViewSet(mixins.CreateModelMixin, mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  mixins.UpdateModelMixin,
                  viewsets.GenericViewSet):
    """
    User API: list, retrieve, update (no create/delete except admin can create shura).
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    pagination_class = CustomPageNumberPagination

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        if not self.request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        user = self.request.user
        # Only allow admin to create users
        if user.role != 'admin':
            raise PermissionDenied('Only admins can create users.')
        # Only allow creation of shura members
        role = self.request.data.get('role', None)  # type: ignore
        if role != 'shura':
            raise PermissionDenied('Only Shura Members can be created via this endpoint.')
        serializer.save()

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return User.objects.none()
            
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        # Add search filter
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            search = search.strip()
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        # Add is_verified_syed filter
        is_verified_syed = self.request.query_params.get('is_verified_syed')
        if is_verified_syed is not None:
            if is_verified_syed.lower() in ['true', '1', 'yes']:
                queryset = queryset.filter(is_verified_syed=True)
            elif is_verified_syed.lower() in ['false', '0', 'no']:
                queryset = queryset.filter(is_verified_syed=False)
        return queryset

    def get_permissions(self):
        return [AllowAny()]

    def list(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        import logging
        logger = logging.getLogger(__name__)
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in UserViewSet.list: {str(e)}", exc_info=True)
            return Response(
                {"detail": "Internal Server Error", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """
        Return the current authenticated user's profile.
        """
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='set_password')
    def set_password(self, request, pk=None):
        """
        Set a new password for a user. Only admins can reset passwords.
        """
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        user = self.get_object()
        
        # Only allow admins to reset passwords
        if request.user.role != 'admin':
            raise PermissionDenied('Only admins can reset user passwords.')
        
        password = request.data.get('password')
        if not password:
            return Response(
                {'error': 'Password is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Comprehensive password validation matching frontend requirements
        errors = []
        if len(password) < 8:
            errors.append('Password must be at least 8 characters long.')
        if not any(c.isupper() for c in password):
            errors.append('Password must contain at least one uppercase letter.')
        if not any(c.isdigit() for c in password):
            errors.append('Password must contain at least one number.')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
            errors.append('Password must contain at least one special character.')
        
        if errors:
            return Response(
                {'error': ' '.join(errors)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set the new password
        user.set_password(password)
        user.save()
        
        return Response(
            {'message': 'Password updated successfully.'},
            status=status.HTTP_200_OK
        ) 

class AdminProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not request.user.role == 'admin':
            return Response({"detail": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
            
        user = request.user
        serializer = AdminProfileSerializer(user)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Admin profile fetched successfully.'
        }, status=status.HTTP_200_OK)

    @transaction.atomic
    def patch(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not request.user.role == 'admin':
            return Response({"detail": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
            
        user = request.user
        serializer = AdminProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'Profile updated successfully.'
            }, status=status.HTTP_200_OK)
        return Response({
            'success': False,
            'data': None,
            'message': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST) 

class ChangePasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not user.check_password(current_password):
            return Response({'success': False, 'message': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        if new_password != confirm_password:
            return Response({'success': False, 'message': 'New passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'success': False, 'message': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'success': True, 'message': 'Password changed successfully.'}, status=status.HTTP_200_OK) 