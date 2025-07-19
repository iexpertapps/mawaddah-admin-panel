# This file is intended for Django's test runner. The imports below are correct in a Django environment.
# noqa: F401, F403, E402 (import errors for Django/DRF are safe to ignore in Django projects)
from django.test import TestCase  # noqa: F401
from django.contrib.auth import get_user_model  # noqa: F401
from rest_framework.test import APIClient  # noqa: F401
from rest_framework import status  # noqa: F401

User = get_user_model()

class MeEndpointTests(TestCase):
    """Tests for the /api/users/me/ endpoint."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='recipient@example.com',
            password='testpass123',
            role='recipient',
            is_verified_syed=True
        )
        self.client = APIClient()

    def test_authenticated_user_can_access_me_endpoint(self):
        """Authenticated user should get 200 and their own data from /api/users/me/."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.user.id)
        self.assertEqual(response.data['email'], self.user.email)

    def test_unauthenticated_user_cannot_access_me_endpoint(self):
        """Unauthenticated user should get 401 Unauthorized from /api/users/me/."""
        response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_endpoint_returns_expected_fields(self):
        """/api/users/me/ should return expected fields and exclude sensitive data."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/users/me/')
        expected_fields = {
            'id', 'email', 'first_name', 'last_name', 'phone', 'role',
            'is_verified_syed', 'country', 'state', 'city',
            'wallet_balance', 'created_at', 'updated_at'
        }
        self.assertTrue(expected_fields.issubset(response.data.keys()))
        self.assertNotIn('password', response.data)
        self.assertNotIn('token', response.data) 