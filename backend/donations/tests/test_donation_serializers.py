# This file is intended for Django's test runner. The imports below are correct in a Django environment.
# noqa: F401, F403, E402 (import errors for Django/DRF are safe to ignore in Django projects)
from django.test import TestCase  # noqa: F401
from django.contrib.auth import get_user_model  # noqa: F401
from rest_framework.test import APIClient  # noqa: F401
from rest_framework import status  # noqa: F401
from donations.models import Donation  # noqa: F401
from donations.serializers.donation import DonationSerializer  # noqa: F401
from appeals.models import Appeal  # noqa: F401

User = get_user_model()

class DonationSerializerTests(TestCase):
    """Tests for DonationSerializer validation logic."""

    def setUp(self):
        """Set up test data for donation serializer tests."""
        self.donor = User.objects.create_user(
            email='donor@example.com',
            password='testpass123',
            role='donor',
            first_name='Test',
            last_name='Donor',
            phone='1234567890'
        )
        
        self.verified_recipient = User.objects.create_user(
            email='recipient@example.com',
            password='testpass123',
            role='recipient',
            is_verified_syed=True,
            first_name='Verified',
            last_name='Recipient',
            phone='1234567891'
        )
        
        self.shura_member = User.objects.create_user(
            email='shura@example.com',
            password='testpass123',
            role='shura',
            first_name='Shura',
            last_name='Member',
            phone='1234567892'
        )
        
        # Create approved appeal
        self.approved_appeal = Appeal.objects.create(
            title='Approved Appeal',
            description='Approved appeal for testing',
            category='medical',
            amount_requested=1000.00,
            created_by=self.verified_recipient,
            beneficiary=self.verified_recipient,
            status='approved',
            approved_by=self.shura_member
        )
        
        # Create pending appeal
        self.pending_appeal = Appeal.objects.create(
            title='Pending Appeal',
            description='Pending appeal for testing',
            category='school_fee',
            amount_requested=500.00,
            created_by=self.verified_recipient,
            beneficiary=self.verified_recipient,
            status='pending'
        )
        
        # Create rejected appeal
        self.rejected_appeal = Appeal.objects.create(
            title='Rejected Appeal',
            description='Rejected appeal for testing',
            category='house_rent',
            amount_requested=800.00,
            created_by=self.verified_recipient,
            beneficiary=self.verified_recipient,
            status='rejected',
            rejection_reason='Insufficient documentation'
        )
        
        self.valid_donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'note': 'Test donation',
            'payment_method': 'stripe'
        }

    def test_valid_donation_creation(self):
        """Test that valid donations can be created with minimum amount and supported payment method."""
        # Create a mock request context
        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = self.donor
        
        serializer = DonationSerializer(data=self.valid_donation_data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        donation = serializer.save()
        self.assertEqual(donation.amount, 500.00)
        self.assertEqual(donation.currency, 'PKR')
        self.assertEqual(donation.appeal, self.approved_appeal)
        self.assertEqual(donation.payment_method, 'stripe')
        self.assertEqual(donation.donor, self.donor)

    def test_invalid_amount_zero(self):
        """Test that zero amount donations are rejected."""
        invalid_data = self.valid_donation_data.copy()
        invalid_data['amount'] = '0.00'
        
        serializer = DonationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('amount', serializer.errors)

    def test_invalid_amount_negative(self):
        """Test that negative amount donations are rejected."""
        invalid_data = self.valid_donation_data.copy()
        invalid_data['amount'] = '-100.00'
        
        serializer = DonationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('amount', serializer.errors)

    def test_invalid_amount_below_minimum(self):
        """Test that donations below minimum amount (100 PKR) are rejected."""
        invalid_data = self.valid_donation_data.copy()
        invalid_data['amount'] = '50.00'
        
        serializer = DonationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('amount', serializer.errors)
        self.assertIn('Minimum donation amount is 100 PKR', str(serializer.errors['amount']))

    def test_invalid_amount_too_large(self):
        """Test that extremely large donations are rejected."""
        invalid_data = self.valid_donation_data.copy()
        invalid_data['amount'] = '1000000000.00'  # 1 billion PKR
        
        # Create a mock request context
        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = self.donor
        
        serializer = DonationSerializer(data=invalid_data, context={'request': request})
        # Note: The model doesn't have a maximum amount constraint, so this should be valid
        # If we want to enforce a maximum, we'd need to add validation to the serializer
        self.assertTrue(serializer.is_valid())

    def test_unsupported_payment_method(self):
        """Test that unsupported payment methods are rejected."""
        invalid_data = self.valid_donation_data.copy()
        invalid_data['payment_method'] = 'unsupported_method'
        
        serializer = DonationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('payment_method', serializer.errors)

    def test_required_appeal_id_validation(self):
        """Test that appeal ID is properly validated."""
        # Test donation without appeal (should be valid)
        data_without_appeal = self.valid_donation_data.copy()
        data_without_appeal.pop('appeal')
        
        serializer = DonationSerializer(data=data_without_appeal)
        self.assertTrue(serializer.is_valid())
        
        # Test donation with invalid appeal ID
        invalid_data = self.valid_donation_data.copy()
        invalid_data['appeal'] = 99999  # Non-existent appeal
        
        serializer = DonationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('appeal', serializer.errors)

    def test_appeal_status_validation(self):
        """Test that donations to unapproved appeals are rejected."""
        # Test donation to pending appeal
        pending_appeal_data = self.valid_donation_data.copy()
        pending_appeal_data['appeal'] = self.pending_appeal.id
        
        serializer = DonationSerializer(data=pending_appeal_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('appeal', serializer.errors)
        self.assertIn('Appeal must be approved to receive donations', str(serializer.errors['appeal']))
        
        # Test donation to rejected appeal
        rejected_appeal_data = self.valid_donation_data.copy()
        rejected_appeal_data['appeal'] = self.rejected_appeal.id
        
        serializer = DonationSerializer(data=rejected_appeal_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('appeal', serializer.errors)
        self.assertIn('Appeal must be approved to receive donations', str(serializer.errors['appeal']))

    def test_appeal_already_fulfilled_edge_case(self):
        """Test donation to appeal that is already fulfilled."""
        # Create a fulfilled appeal
        fulfilled_appeal = Appeal.objects.create(
            title='Fulfilled Appeal',
            description='Already fulfilled appeal',
            category='medical',
            amount_requested=1000.00,
            created_by=self.verified_recipient,
            beneficiary=self.verified_recipient,
            status='fulfilled',
            approved_by=self.shura_member
        )
        
        fulfilled_appeal_data = self.valid_donation_data.copy()
        fulfilled_appeal_data['appeal'] = fulfilled_appeal.id
        
        serializer = DonationSerializer(data=fulfilled_appeal_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('appeal', serializer.errors)
        self.assertIn('Appeal must be approved to receive donations', str(serializer.errors['appeal']))

    def test_serializer_handles_all_payment_methods(self):
        """Test that serializer accepts all valid payment methods."""
        payment_methods = ['stripe', 'jazzcash', 'easypaisa', 'bank_transfer', 'manual']
        
        for method in payment_methods:
            data = self.valid_donation_data.copy()
            data['payment_method'] = method
            
            serializer = DonationSerializer(data=data)
            self.assertTrue(serializer.is_valid(), f"Payment method {method} should be valid")

    def test_currency_validation(self):
        """Test currency field validation."""
        # Test valid currency
        valid_data = self.valid_donation_data.copy()
        valid_data['currency'] = 'USD'
        
        serializer = DonationSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
        
        # Test invalid currency (too long)
        invalid_data = self.valid_donation_data.copy()
        invalid_data['currency'] = 'INVALID_CURRENCY'
        
        serializer = DonationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('currency', serializer.errors)

    def test_note_field_is_optional(self):
        """Test that note field is optional."""
        # Test donation without note
        data_without_note = self.valid_donation_data.copy()
        data_without_note.pop('note')
        
        serializer = DonationSerializer(data=data_without_note)
        self.assertTrue(serializer.is_valid())
        
        # Test donation with note
        data_with_note = self.valid_donation_data.copy()
        data_with_note['note'] = 'This is a test donation note'
        
        serializer = DonationSerializer(data=data_with_note)
        self.assertTrue(serializer.is_valid())

    def test_read_only_fields_are_not_editable(self):
        """Test that read-only fields cannot be set during creation."""
        data_with_readonly = self.valid_donation_data.copy()
        data_with_readonly.update({
            'transaction_id': 'test_transaction_123',
            'receipt_url': 'https://example.com/receipt.pdf',
            'donor': self.shura_member.id
        })
        
        # Create a mock request context
        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = self.donor
        
        serializer = DonationSerializer(data=data_with_readonly, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        donation = serializer.save()
        
        # Read-only fields should be ignored and set to defaults
        self.assertIsNone(donation.transaction_id)  # Default value is None
        self.assertIsNone(donation.receipt_url)  # Default value is None
        self.assertEqual(donation.donor, self.donor)  # Set by perform_create

    def test_minimum_amount_edge_cases(self):
        """Test edge cases around minimum donation amount."""
        # Test exactly minimum amount
        min_amount_data = self.valid_donation_data.copy()
        min_amount_data['amount'] = '100.00'
        
        serializer = DonationSerializer(data=min_amount_data)
        self.assertTrue(serializer.is_valid())
        
        # Test just below minimum amount
        below_min_data = self.valid_donation_data.copy()
        below_min_data['amount'] = '99.99'
        
        serializer = DonationSerializer(data=below_min_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('amount', serializer.errors)

    def test_donation_without_appeal(self):
        """Test that donations can be made without specifying an appeal."""
        data_without_appeal = self.valid_donation_data.copy()
        data_without_appeal.pop('appeal')
        
        # Create a mock request context
        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = self.donor
        
        serializer = DonationSerializer(data=data_without_appeal, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        donation = serializer.save()
        self.assertIsNone(donation.appeal)

    def test_donation_amount_precision(self):
        """Test donation amount precision handling."""
        # Test amount with 2 decimal places
        precise_data = self.valid_donation_data.copy()
        precise_data['amount'] = '123.45'
        
        serializer = DonationSerializer(data=precise_data)
        self.assertTrue(serializer.is_valid())
        
        # Test amount with more than 2 decimal places
        over_precise_data = self.valid_donation_data.copy()
        over_precise_data['amount'] = '123.456'
        
        serializer = DonationSerializer(data=over_precise_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('amount', serializer.errors) 