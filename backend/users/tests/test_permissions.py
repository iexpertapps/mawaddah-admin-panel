# This file is intended for Django's test runner. The imports below are correct in a Django environment.
# noqa: F401, F403, E402 (import errors for Django/DRF are safe to ignore in Django projects)
from django.test import TestCase  # noqa: F401
from django.contrib.auth import get_user_model  # noqa: F401
from rest_framework.test import APIClient  # noqa: F401
from rest_framework import status  # noqa: F401

User = get_user_model()

class UserPermissionTests(TestCase):
    """Tests for user permission and access control."""

    def setUp(self):
        """Set up test users for permission testing."""
        # Create test users with different roles
        self.user_a = User.objects.create_user(
            email='usera@example.com',
            password='testpass123',
            role='user',
            first_name='User',
            last_name='A'
        )
        
        self.user_b = User.objects.create_user(
            email='userb@example.com',
            password='testpass123',
            role='user',
            first_name='User',
            last_name='B'
        )
        
        self.recipient = User.objects.create_user(
            email='recipient@example.com',
            password='testpass123',
            role='recipient',
            is_verified_syed=True,
            first_name='Verified',
            last_name='Recipient'
        )
        
        self.donor = User.objects.create_user(
            email='donor@example.com',
            password='testpass123',
            role='donor',
            first_name='Test',
            last_name='Donor'
        )
        
        self.shura = User.objects.create_user(
            email='shura@example.com',
            password='testpass123',
            role='shura',
            first_name='Shura',
            last_name='Member'
        )
        
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='testpass123',
            role='admin'
        )
        
        self.client = APIClient()

    def test_user_cannot_update_other_users_profile(self):
        """Test that users cannot update other users' profiles (IsOwnerOrReadOnly enforced)."""
        self.client.force_authenticate(user=self.user_a)
        
        # Attempt to update user_b's profile
        update_data = {'first_name': 'Hacked'}
        response = self.client.patch(f'/api/users/{self.user_b.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_recipient_can_only_access_own_data(self):
        """Test that recipients can only access their own user data."""
        self.client.force_authenticate(user=self.recipient)
        
        # Try to access another user's profile
        response = self.client.get(f'/api/users/{self.user_a.id}/')
        
        # Should be forbidden or not found
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_admin_can_access_all_user_profiles(self):
        """Test that admin can access all user profiles."""
        self.client.force_authenticate(user=self.admin)
        
        # Access different user profiles
        users = [self.user_a, self.user_b, self.recipient, self.donor, self.shura]
        
        for user in users:
            response = self.client.get(f'/api/users/{user.id}/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['id'], user.id)

    def test_donor_cannot_access_admin_endpoints(self):
        """Test that donors cannot access admin-only endpoints."""
        self.client.force_authenticate(user=self.donor)
        
        # Try to access user list (admin endpoint)
        response = self.client.get('/api/users/')
        
        # Should be forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_permission_classes_attached_to_viewsets(self):
        """Test that viewsets have proper permission classes attached."""
        from users.views.user import UserViewSet
        
        # Check that UserViewSet has permission classes
        self.assertTrue(hasattr(UserViewSet, 'permission_classes'))
        self.assertIn('IsAuthenticated', [perm.__name__ for perm in UserViewSet.permission_classes])

    def test_shura_cannot_update_unrelated_user(self):
        """Test that shura members cannot update unrelated user profiles."""
        self.client.force_authenticate(user=self.shura)
        
        # Try to update a donor's profile
        update_data = {'first_name': 'Unauthorized'}
        response = self.client.patch(f'/api/users/{self.donor.id}/', update_data)
        
        # Should be forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_can_update_own_profile(self):
        """Test that users can update their own profiles."""
        self.client.force_authenticate(user=self.user_a)
        
        update_data = {'first_name': 'Updated'}
        response = self.client.patch(f'/api/users/{self.user_a.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')

    def test_unauthenticated_user_cannot_access_protected_endpoints(self):
        """Test that unauthenticated users cannot access protected endpoints."""
        # Try to access user profile without authentication
        response = self.client.get(f'/api/users/{self.user_a.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Try to update user profile without authentication
        update_data = {'first_name': 'Unauthorized'}
        response = self.client.patch(f'/api/users/{self.user_a.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_role_based_permission_classes(self):
        """Test that role-based permission classes work correctly."""
        from users.permissions.user_permissions import IsDonor, IsShura, IsAdmin
        
        # Create mock request and view objects
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        class MockView:
            pass
        
        # Test IsDonor permission
        donor_permission = IsDonor()
        donor_request = MockRequest(self.donor)
        self.assertTrue(donor_permission.has_permission(donor_request, MockView()))
        self.assertFalse(donor_permission.has_permission(MockRequest(self.user_a), MockView()))
        
        # Test IsShura permission
        shura_permission = IsShura()
        shura_request = MockRequest(self.shura)
        self.assertTrue(shura_permission.has_permission(shura_request, MockView()))
        self.assertFalse(shura_permission.has_permission(MockRequest(self.user_a), MockView()))
        
        # Test IsAdmin permission
        admin_permission = IsAdmin()
        admin_request = MockRequest(self.admin)
        self.assertTrue(admin_permission.has_permission(admin_request, MockView()))
        self.assertFalse(admin_permission.has_permission(MockRequest(self.user_a), MockView()))

    def test_is_owner_or_read_only_permission(self):
        """Test IsOwnerOrReadOnly permission logic."""
        from users.permissions.user_permissions import IsOwnerOrReadOnly
        
        permission = IsOwnerOrReadOnly()
        
        # Create mock request object
        class MockRequest:
            def __init__(self, method):
                self.method = method
        
        # Test read permission (should be allowed)
        self.assertTrue(permission.has_object_permission(MockRequest('GET'), None, self.user_a, self.user_a))
        
        # Test write permission for own object (should be allowed)
        self.assertTrue(permission.has_object_permission(MockRequest('PATCH'), None, self.user_a, self.user_a))
        
        # Test write permission for other object (should be denied)
        self.assertFalse(permission.has_object_permission(MockRequest('PATCH'), None, self.user_a, self.user_b))

    def test_recipient_cannot_access_donor_data(self):
        """Test that recipients cannot access donor-specific data."""
        self.client.force_authenticate(user=self.recipient)
        
        # Try to access donor profile
        response = self.client.get(f'/api/users/{self.donor.id}/')
        
        # Should be forbidden or not found
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_admin_can_update_any_user(self):
        """Test that admin can update any user's profile."""
        self.client.force_authenticate(user=self.admin)
        
        update_data = {'first_name': 'Admin Updated'}
        response = self.client.patch(f'/api/users/{self.user_a.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Admin Updated') 