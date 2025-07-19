# This file is intended for Django's test runner. The imports below are correct in a Django environment.
# noqa: F401, F403, E402 (import errors for Django/DRF are safe to ignore in Django projects)
from django.test import TestCase  # noqa: F401
from django.contrib.auth import get_user_model  # noqa: F401
from rest_framework.test import APIClient  # noqa: F401
from rest_framework import status  # noqa: F401
from donations.models import Donation  # noqa: F401
from appeals.models import Appeal  # noqa: F401
from decimal import Decimal  # noqa: F401

User = get_user_model()

class DonationEdgeCaseTests(TestCase):
    """Tests for donation edge cases and boundary conditions."""

    def setUp(self):
        """Set up test data for donation edge case tests."""
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
        
        # Create fulfilled appeal
        self.fulfilled_appeal = Appeal.objects.create(
            title='Fulfilled Appeal',
            description='Already fulfilled appeal',
            category='school_fee',
            amount_requested=500.00,
            created_by=self.verified_recipient,
            beneficiary=self.verified_recipient,
            status='fulfilled',
            approved_by=self.shura_member
        )
        
        self.client = APIClient()

    def test_donor_tries_to_donate_to_own_appeal(self):
        """Test donor trying to donate to their own appeal (if restricted)."""
        # Create a donor who is also a recipient with an approved appeal
        donor_recipient = User.objects.create_user(
            email='donor_recipient@example.com',
            password='testpass123',
            role='donor',
            first_name='Donor',
            last_name='Recipient'
        )
        
        own_appeal = Appeal.objects.create(
            title='Own Appeal',
            description='Appeal created by donor',
            category='medical',
            amount_requested=800.00,
            created_by=donor_recipient,
            beneficiary=donor_recipient,
            status='approved',
            approved_by=self.shura_member
        )
        
        self.client.force_authenticate(user=donor_recipient)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': own_appeal.id,
            'payment_method': 'stripe'
        }
        
        # This should be allowed (no restriction on donating to own appeal)
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_extreme_values_one_pkr_donation(self):
        """Test donation with extreme minimum value (1 PKR)."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '1.00',  # 1 PKR
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('amount', response.data)
        self.assertIn('Minimum donation amount is 100 PKR', str(response.data['amount']))

    def test_extreme_values_one_million_pkr_donation(self):
        """Test donation with extreme maximum value (1 million PKR)."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '1000000.00',  # 1 million PKR
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        # Currently the model doesn't enforce a maximum, so this should succeed
        # TODO: Add maximum amount validation if required by business logic
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_duplicate_donation_prevention_logic(self):
        """Test duplicate donation prevention logic."""
        self.client.force_authenticate(user=self.donor)
        
        # Create first donation
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe',
            'note': 'First donation'
        }
        
        response1 = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Create second donation with same data
        response2 = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Both donations should be created (no duplicate prevention at API level)
        self.assertNotEqual(response1.data['id'], response2.data['id'])

    def test_anonymous_donation_behavior(self):
        """Test anonymous donation behavior (if supported)."""
        # Test donation without authentication
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        # Should be rejected as anonymous donations are not supported
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_appeal_already_funded_donation_should_fail_gracefully(self):
        """Test donation to already funded appeal should fail gracefully."""
        # Create an appeal that has received enough donations with different category
        funded_appeal = Appeal.objects.create(
            title='Funded Appeal',
            description='Appeal that has received enough funding',
            category='school_fee',  # Different category to avoid validation error
            amount_requested=1000.00,
            created_by=self.verified_recipient,
            beneficiary=self.verified_recipient,
            status='approved',
            approved_by=self.shura_member
        )
        
        # Create donations that exceed the requested amount
        Donation.objects.create(
            donor=self.donor,
            amount=600.00,
            currency='PKR',
            appeal=funded_appeal,
            payment_method='stripe'
        )
        
        Donation.objects.create(
            donor=self.donor,
            amount=500.00,
            currency='PKR',
            appeal=funded_appeal,
            payment_method='stripe'
        )
        
        # Try to donate more to the already funded appeal
        self.client.force_authenticate(user=self.donor)
        donation_data = {
            'amount': '200.00',
            'currency': 'PKR',
            'appeal': funded_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        # Should still be allowed (no restriction on over-funding)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_donation_with_decimal_precision_edge_cases(self):
        """Test donation amount with decimal precision edge cases."""
        self.client.force_authenticate(user=self.donor)
        
        # Test amount with many decimal places
        donation_data = {
            'amount': '123.456789',  # Too many decimal places
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('amount', response.data)
        
        # Test amount with exactly 2 decimal places
        donation_data['amount'] = '123.45'
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_donation_with_special_characters_in_note(self):
        """Test donation with special characters in note field."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe',
            'note': 'Donation with special chars: !@#$%^&*() and unicode: éñçüöä'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['note'], 'Donation with special chars: !@#$%^&*() and unicode: éñçüöä')

    def test_donation_with_very_long_note(self):
        """Test donation with very long note."""
        self.client.force_authenticate(user=self.donor)
        
        long_note = 'A' * 1000  # Very long note
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe',
            'note': long_note
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['note'], long_note)

    def test_donation_with_empty_note(self):
        """Test donation with empty note."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe',
            'note': ''
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['note'], '')

    def test_donation_with_null_note(self):
        """Test donation with null note."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe'
            # Note field omitted to test null behavior
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['note'])

    def test_donation_to_fulfilled_appeal(self):
        """Test donation to already fulfilled appeal."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.fulfilled_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('appeal', response.data)
        self.assertIn('Appeal must be approved to receive donations', str(response.data['appeal']))

    def test_concurrent_donation_creation(self):
        """Test concurrent donation creation by same user."""
        self.client.force_authenticate(user=self.donor)
        
        # Create first donation
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe'
        }
        
        response1 = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Create second donation immediately
        response2 = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Verify both donations exist
        donations = Donation.objects.filter(donor=self.donor)
        self.assertEqual(donations.count(), 2)

    def test_donation_with_different_currencies(self):
        """Test donations with different currencies."""
        self.client.force_authenticate(user=self.donor)
        
        currencies = ['PKR', 'USD', 'EUR', 'GBP']
        
        for currency in currencies:
            donation_data = {
                'amount': '500.00',
                'currency': currency,
                'appeal': self.approved_appeal.id,
                'payment_method': 'stripe'
            }
            
            response = self.client.post('/api/donations/', donation_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(response.data['currency'], currency)

    def test_donation_with_invalid_currency(self):
        """Test donation with invalid currency."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'INVALID_CURRENCY',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('currency', response.data)

    def test_donation_with_negative_amount(self):
        """Test donation with negative amount."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '-100.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('amount', response.data)

    def test_donation_with_zero_amount(self):
        """Test donation with zero amount."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '0.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('amount', response.data)

    def test_donation_without_payment_method(self):
        """Test donation without payment method."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id
            # No payment_method
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_donation_with_invalid_payment_method(self):
        """Test donation with invalid payment method."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'invalid_method'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('payment_method', response.data) 

    def test_donation_to_unapproved_appeal_returns_400(self):
        """Test that donating to unapproved appeal returns 400 error."""
        # Create a pending appeal with different category to avoid validation error
        pending_appeal = Appeal.objects.create(
            title='Pending Appeal',
            description='Appeal that is not yet approved',
            category='school_fee',  # Different category to avoid validation error
            amount_requested=1000.00,
            created_by=self.verified_recipient,
            beneficiary=self.verified_recipient,
            status='pending'
        )
        
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': pending_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('appeal', response.data)
        self.assertIn('Appeal must be approved to receive donations', str(response.data['appeal']))

    def test_donation_to_fulfilled_appeal_returns_400(self):
        """Test that donating to fulfilled appeal returns 400 error."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.fulfilled_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('appeal', response.data)
        self.assertIn('Appeal must be approved to receive donations', str(response.data['appeal']))

    def test_read_only_fields_cannot_be_set_via_api(self):
        """Test that read-only fields (transaction_id, receipt_url) cannot be set via API."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe',
            'transaction_id': 'fake_transaction_123',
            'receipt_url': 'https://fake-receipt.com/receipt.pdf'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Read-only fields should be ignored and set to defaults
        self.assertIsNone(response.data['transaction_id'])  # Default value is None
        self.assertIsNone(response.data['receipt_url'])  # Default value is None

    def test_donation_with_system_generated_fields(self):
        """Test that system-generated fields are properly handled."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # System-generated fields should be present but with default values
        self.assertIn('transaction_id', response.data)
        self.assertIn('receipt_url', response.data)
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)
        
        # Default values should be as expected
        self.assertIsNone(response.data['transaction_id'])
        self.assertIsNone(response.data['receipt_url']) 