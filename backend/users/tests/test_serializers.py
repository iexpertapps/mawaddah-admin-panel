# This file is intended for Django's test runner. The import below is correct in a Django environment.
# noqa: E402 (import not at top of file), F401 (imported but unused), and linter import errors for django.test are safe to ignore in Django projects.
from django.test import TestCase  # noqa: F401
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

    def test_is_verified_syed_true_for_non_recipient(self):
        """Should raise error if is_verified_syed is True for non-recipient role."""
        data = {
            'email': 'user@example.com',
            'password': 'password123',
            'password_confirm': 'password123',
            'role': 'donor',
            'is_verified_syed': True,
        }
        serializer = UserCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('is_verified_syed', serializer.errors) 