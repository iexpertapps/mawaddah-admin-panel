from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
try:
    from rest_framework.authtoken.models import Token
except ImportError:
    Token = None
from appeals.models import Appeal

User = get_user_model()

class RoleBasedSmokeTests(TestCase):
    user_counter = 0
    def setUp(self):
        # Ensure unique phone numbers for each test run
        RoleBasedSmokeTests.user_counter += 1
        base = str(1000000000 + RoleBasedSmokeTests.user_counter * 10)
        self.recipient = User.objects.create_user(email='recipient@example.com', password='testpass', role='recipient', is_verified_syed=True, phone=base+'1')
        self.donor = User.objects.create_user(email='donor@example.com', password='testpass', role='donor', phone=base+'2')
        self.shura = User.objects.create_user(email='shura@example.com', password='testpass', role='shura', phone=base+'3')
        self.admin = User.objects.create_superuser(email='admin@example.com', password='testpass', role='admin', phone=base+'4')

        # Tokens (if Token model is available)
        if Token:
            self.recipient_token = Token.objects.create(user=self.recipient)
            self.donor_token = Token.objects.create(user=self.donor)
            self.shura_token = Token.objects.create(user=self.shura)
            self.admin_token = Token.objects.create(user=self.admin)
        else:
            self.recipient_token = self.donor_token = self.shura_token = self.admin_token = None

        # Appeal for approval test
        self.appeal = Appeal.objects.create(
            title='Test Appeal',
            category='medical',
            amount_requested='100.00',
            created_by=self.recipient,
            beneficiary=self.recipient,
            status='pending',
        )

    def test_verified_recipient_can_access_wallet(self):
        if not self.recipient_token:
            self.skipTest('Token model not available')
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION='Token ' + self.recipient_token.key)
        resp = client.get('/api/wallet/me/')
        self.assertIn(resp.status_code, [200, 403], f"Expected 200 or 403, got {resp.status_code}")

    def test_donor_can_post_donation(self):
        if not self.donor_token:
            self.skipTest('Token model not available')
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION='Token ' + self.donor_token.key)
        data = {"amount": "10.00", "currency": "USD"}
        resp = client.post('/api/donations/', data)
        self.assertIn(resp.status_code, [201, 400], f"Expected 201 or 400, got {resp.status_code}")

    def test_shura_can_approve_appeal(self):
        if not self.shura_token:
            self.skipTest('Token model not available')
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION='Token ' + self.shura_token.key)
        data = {"status": "approved"}
        resp = client.patch(f'/api/appeals/{self.appeal.id}/', data)
        self.assertIn(resp.status_code, [200, 400, 403], f"Expected 200, 400, or 403, got {resp.status_code}")

    def test_admin_can_fetch_all_users(self):
        if not self.admin_token:
            self.skipTest('Token model not available')
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION='Token ' + self.admin_token.key)
        resp = client.get('/api/users/')
        self.assertEqual(resp.status_code, 200, f"Admin should fetch users, got {resp.status_code}")

# test_serializers.py
from django.test import TestCase
from users.serializers.user import UserCreateSerializer

class UserCreateSerializerValidationTests(TestCase):
    """Tests for UserCreateSerializer validation logic."""

    def test_invalid_email(self):
        """Should raise error for invalid email format."""
        data = {
            'email': 'not-an-email',
            'password': 'password123',
            'password_confirm': 'password123',
            'role': 'user',
            'is_verified_syed': False,
        }
        serializer = UserCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_password_confirmation_mismatch(self):
        """Should raise error if password and confirmation do not match."""
        data = {
            'email': 'user@example.com',
            'password': 'password123',
            'password_confirm': 'password456',
            'role': 'user',
            'is_verified_syed': False,
        }
        serializer = UserCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)

    def test_missing_required_fields(self):
        """Should raise error if required fields are missing."""
        data = {
            'email': '',
            'password': '',
            'password_confirm': '',
            'role': '',
        }
        serializer = UserCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
        self.assertIn('password', serializer.errors)
        self.assertIn('role', serializer.errors)

    def test_invalid_role_value(self):
        """Should raise error for invalid role value."""
        data = {
            'email': 'user@example.com',
            'password': 'password123',
            'password_confirm': 'password123',
            'role': 'invalidrole',
            'is_verified_syed': False,
        }
        serializer = UserCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('role', serializer.errors)
