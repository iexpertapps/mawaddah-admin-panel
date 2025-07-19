# This file is intended for Django's test runner. The imports below are correct in a Django environment.
# noqa: F401, F403, E402 (import errors for Django/DRF are safe to ignore in Django projects)
from django.test import TestCase  # noqa: F401
from django.contrib.auth import get_user_model  # noqa: F401
from rest_framework.test import APIClient  # noqa: F401
from rest_framework import status  # noqa: F401
from appeals.models import Appeal  # noqa: F401
from appeals.serializers.appeal import AppealSerializer  # noqa: F401

User = get_user_model()

class AppealSerializerTests(TestCase):
    """Tests for AppealSerializer validation logic."""

    def setUp(self):
        """Set up test data for appeal serializer tests."""
        self.verified_recipient = User.objects.create_user(
            email='recipient@example.com',
            password='testpass123',
            role='recipient',
            is_verified_syed=True,
            first_name='Verified',
            last_name='Recipient',
            phone='1234567890'
        )
        
        self.shura_member = User.objects.create_user(
            email='shura@example.com',
            password='testpass123',
            role='shura',
            first_name='Shura',
            last_name='Member',
            phone='0987654321'
        )
        
        self.valid_appeal_data = {
            'title': 'Test Appeal',
            'description': 'This is a test appeal',
            'category': 'medical',
            'amount_requested': '1000.00',
            'is_monthly': False,
            'months_required': None
        }

    def test_valid_appeal_creation_for_verified_recipient(self):
        """Test that verified recipients can create valid appeals."""
        serializer = AppealSerializer(data=self.valid_appeal_data)
        self.assertTrue(serializer.is_valid())
        
        appeal = serializer.save(created_by=self.verified_recipient, beneficiary=self.verified_recipient)
        self.assertEqual(appeal.title, 'Test Appeal')
        self.assertEqual(appeal.category, 'medical')
        self.assertEqual(appeal.amount_requested, 1000.00)
        self.assertEqual(appeal.created_by, self.verified_recipient)
        self.assertEqual(appeal.beneficiary, self.verified_recipient)

    def test_invalid_category_raises_validation_error(self):
        """Test that invalid category raises validation error."""
        invalid_data = self.valid_appeal_data.copy()
        invalid_data['category'] = 'invalid_category'
        
        serializer = AppealSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('category', serializer.errors)

    def test_missing_required_fields_raises_validation_error(self):
        """Test that missing required fields raises validation error."""
        # Test missing title
        invalid_data = self.valid_appeal_data.copy()
        invalid_data.pop('title')
        
        serializer = AppealSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('title', serializer.errors)
        
        # Test missing category
        invalid_data = self.valid_appeal_data.copy()
        invalid_data.pop('category')
        
        serializer = AppealSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('category', serializer.errors)
        
        # Test missing amount_requested
        invalid_data = self.valid_appeal_data.copy()
        invalid_data.pop('amount_requested')
        
        serializer = AppealSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('amount_requested', serializer.errors)

    def test_monthly_appeal_validation_months_required_must_be_greater_than_one(self):
        """Test that monthly appeals require months_required to be between 1 and 6."""
        # Test valid monthly appeal
        monthly_data = self.valid_appeal_data.copy()
        monthly_data.update({
            'is_monthly': True,
            'months_required': 3
        })
        
        serializer = AppealSerializer(data=monthly_data)
        self.assertTrue(serializer.is_valid())
        
        # Test monthly appeal without months_required
        invalid_monthly_data = self.valid_appeal_data.copy()
        invalid_monthly_data.update({
            'is_monthly': True,
            'months_required': None
        })
        
        serializer = AppealSerializer(data=invalid_monthly_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('months_required', serializer.errors)
        
        # Test monthly appeal with months_required = 0
        invalid_monthly_data = self.valid_appeal_data.copy()
        invalid_monthly_data.update({
            'is_monthly': True,
            'months_required': 0
        })
        
        serializer = AppealSerializer(data=invalid_monthly_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('months_required', serializer.errors)
        
        # Test monthly appeal with months_required > 6
        invalid_monthly_data = self.valid_appeal_data.copy()
        invalid_monthly_data.update({
            'is_monthly': True,
            'months_required': 7
        })
        
        serializer = AppealSerializer(data=invalid_monthly_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('months_required', serializer.errors)

    def test_non_monthly_appeal_does_not_require_months_required(self):
        """Test that non-monthly appeals don't require months_required."""
        non_monthly_data = self.valid_appeal_data.copy()
        non_monthly_data.update({
            'is_monthly': False,
            'months_required': None
        })
        
        serializer = AppealSerializer(data=non_monthly_data)
        self.assertTrue(serializer.is_valid())

    def test_amount_requested_validation(self):
        """Test amount_requested field validation."""
        # Test valid amount
        valid_data = self.valid_appeal_data.copy()
        valid_data['amount_requested'] = '500.50'
        
        serializer = AppealSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
        
        # Test invalid amount (negative)
        invalid_data = self.valid_appeal_data.copy()
        invalid_data['amount_requested'] = '-100.00'
        
        serializer = AppealSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('amount_requested', serializer.errors)
        
        # Test invalid amount (non-numeric)
        invalid_data = self.valid_appeal_data.copy()
        invalid_data['amount_requested'] = 'invalid'
        
        serializer = AppealSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('amount_requested', serializer.errors)

    def test_title_length_validation(self):
        """Test title field length validation."""
        # Test valid title length
        valid_data = self.valid_appeal_data.copy()
        valid_data['title'] = 'A' * 100  # Max length
        
        serializer = AppealSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
        
        # Test title too long
        invalid_data = self.valid_appeal_data.copy()
        invalid_data['title'] = 'A' * 101  # Exceeds max length
        
        serializer = AppealSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('title', serializer.errors)

    def test_read_only_fields_are_not_editable(self):
        """Test that read-only fields cannot be set during creation."""
        data_with_readonly = self.valid_appeal_data.copy()
        data_with_readonly.update({
            'status': 'approved',
            'is_urgent': True,
            'created_by': self.shura_member.id,
            'beneficiary': self.shura_member.id
        })
        
        serializer = AppealSerializer(data=data_with_readonly)
        self.assertTrue(serializer.is_valid())
        
        appeal = serializer.save(created_by=self.verified_recipient, beneficiary=self.verified_recipient)
        
        # Read-only fields should be ignored and set to defaults
        self.assertEqual(appeal.status, 'pending')  # Default value
        self.assertEqual(appeal.is_urgent, False)  # Default value
        self.assertEqual(appeal.created_by, self.verified_recipient)  # Set by perform_create
        self.assertEqual(appeal.beneficiary, self.verified_recipient)  # Set by perform_create

    def test_serializer_handles_all_categories(self):
        """Test that serializer accepts all valid categories."""
        categories = [
            'house_rent', 'school_fee', 'medical', 'utility_bills',
            'debt', 'business_support', 'death_support', 'other'
        ]
        
        for category in categories:
            data = self.valid_appeal_data.copy()
            data['category'] = category
            
            serializer = AppealSerializer(data=data)
            self.assertTrue(serializer.is_valid(), f"Category {category} should be valid")

    def test_description_field_is_optional(self):
        """Test that description field is optional."""
        data_without_description = self.valid_appeal_data.copy()
        data_without_description['description'] = ''
        
        serializer = AppealSerializer(data=data_without_description)
        self.assertTrue(serializer.is_valid())
        
        data_with_description = self.valid_appeal_data.copy()
        data_with_description['description'] = 'This is a detailed description'
        
        serializer = AppealSerializer(data=data_with_description)
        self.assertTrue(serializer.is_valid()) 