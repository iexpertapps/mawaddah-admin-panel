# This file is intended for Django's test runner. The imports below are correct in a Django environment.
# noqa: F401, F403, E402 (import errors for Django/DRF are safe to ignore in Django projects)
from django.test import TestCase  # noqa: F401
from django.contrib.auth import get_user_model  # noqa: F401
from rest_framework.test import APIClient  # noqa: F401
from rest_framework import status  # noqa: F401
from donations.models import Donation  # noqa: F401
from appeals.models import Appeal  # noqa: F401

User = get_user_model()

class DonationEndpointTests(TestCase):
    """Tests for donation API endpoints."""

    def setUp(self):
        """Set up test data for donation endpoint tests."""
        # Create test users with different roles
        self.donor = User.objects.create_user(
            email='donor@example.com',
            password='testpass123',
            role='donor',
            first_name='Test',
            last_name='Donor',
            phone='1234567890'
        )
        
        self.donor_2 = User.objects.create_user(
            email='donor2@example.com',
            password='testpass123',
            role='donor',
            first_name='Test',
            last_name='Donor2',
            phone='1234567891'
        )
        
        self.verified_recipient = User.objects.create_user(
            email='recipient@example.com',
            password='testpass123',
            role='recipient',
            is_verified_syed=True,
            first_name='Verified',
            last_name='Recipient',
            phone='1234567892'
        )
        
        self.shura_member = User.objects.create_user(
            email='shura@example.com',
            password='testpass123',
            role='shura',
            first_name='Shura',
            last_name='Member',
            phone='1234567893'
        )
        
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='testpass123',
            role='admin',
            phone='1234567894'
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
        
        # Create test donations
        self.donation_1 = Donation.objects.create(
            donor=self.donor,
            amount=500.00,
            currency='PKR',
            appeal=self.approved_appeal,
            payment_method='stripe',
            note='First donation'
        )
        
        self.donation_2 = Donation.objects.create(
            donor=self.donor_2,
            amount=300.00,
            currency='PKR',
            appeal=self.approved_appeal,
            payment_method='jazzcash',
            note='Second donation'
        )
        
        self.donation_3 = Donation.objects.create(
            donor=self.donor,
            amount=200.00,
            currency='PKR',
            appeal=None,  # General donation
            payment_method='easypaisa',
            note='General donation'
        )
        
        self.client = APIClient()

    def test_authenticated_donor_can_post_donations(self):
        """Test that authenticated donors can POST to /api/donations/."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '1000.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'note': 'Test donation via API',
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['amount'], '1000.00')
        self.assertEqual(response.data['donor']['id'], self.donor.id)
        self.assertEqual(response.data['appeal'], self.approved_appeal.id)

    def test_donor_can_view_own_donations(self):
        """Test that donors can view their own donations at /api/donations/."""
        self.client.force_authenticate(user=self.donor)
        response = self.client.get('/api/donations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only show donations by the authenticated donor
        for donation in response.data.get('results', []):
            self.assertEqual(donation['donor']['id'], self.donor.id)

    def test_admin_can_view_all_donations(self):
        """Test that admin can view all donations."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/donations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should show all donations
        donation_ids = [donation['id'] for donation in response.data.get('results', [])]
        # Check that donations with matching attributes exist
        found_1 = any(d['amount'] == '500.00' and d['note'] == 'First donation' for d in response.data.get('results', []))
        found_2 = any(d['amount'] == '300.00' and d['note'] == 'Second donation' for d in response.data.get('results', []))
        found_3 = any(d['amount'] == '200.00' and d['note'] == 'General donation' for d in response.data.get('results', []))
        self.assertTrue(found_1)
        self.assertTrue(found_2)
        self.assertTrue(found_3)

    def test_unauthorized_user_receives_403_401(self):
        """Test that unauthorized users receive 403/401 on donation endpoints."""
        # Test unauthenticated user
        response = self.client.get('/api/donations/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        
        donation_data = {
            'amount': '1000.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id
        }
        response = self.client.post('/api/donations/', donation_data)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        
        # Test recipient trying to donate
        self.client.force_authenticate(user=self.verified_recipient)
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test shura trying to donate
        self.client.force_authenticate(user=self.shura_member)
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_donation_detail_for_donor(self):
        """Test GET /api/donations/{id}/ for donor."""
        self.client.force_authenticate(user=self.donor)
        response = self.client.get(f'/api/donations/{self.donation_1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.donation_1.id)
        self.assertEqual(response.data['amount'], '500.00')
        self.assertEqual(response.data['donor']['id'], self.donor.id)

    def test_get_donation_detail_for_admin(self):
        """Test GET /api/donations/{id}/ for admin."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f'/api/donations/{self.donation_2.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.donation_2.id)
        self.assertEqual(response.data['amount'], '300.00')
        self.assertEqual(response.data['donor']['id'], self.donor_2.id)

    def test_donor_cannot_access_other_donor_donation(self):
        """Test that donors cannot access other donors' donations."""
        self.client.force_authenticate(user=self.donor)
        response = self.client.get(f'/api/donations/{self.donation_2.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_invalid_post_to_unapproved_appeal(self):
        """Test POST to unapproved appeal should fail."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '1000.00',
            'currency': 'PKR',
            'appeal': self.pending_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('appeal', response.data)

    def test_donation_without_appeal(self):
        """Test donation creation without specifying an appeal."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'payment_method': 'stripe',
            'note': 'General donation'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['appeal'])

    def test_donation_with_minimum_amount(self):
        """Test donation creation with minimum amount."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '100.00',  # Minimum amount
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['amount'], '100.00')

    def test_donation_with_below_minimum_amount(self):
        """Test donation creation with amount below minimum."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '50.00',  # Below minimum
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('amount', response.data)

    def test_donation_with_unsupported_payment_method(self):
        """Test donation creation with unsupported payment method."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'unsupported_method'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('payment_method', response.data)

    def test_donation_with_all_payment_methods(self):
        """Test donation creation with all supported payment methods."""
        self.client.force_authenticate(user=self.donor)
        
        payment_methods = ['stripe', 'jazzcash', 'easypaisa', 'bank_transfer', 'manual']
        
        for method in payment_methods:
            donation_data = {
                'amount': '500.00',
                'currency': 'PKR',
                'appeal': self.approved_appeal.id,
                'payment_method': method
            }
            
            response = self.client.post('/api/donations/', donation_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Payment method {method} should work")

    def test_donation_list_pagination(self):
        """Test that donation list endpoint supports pagination."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/donations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check if pagination is implemented
        self.assertIn('results', response.data)

    def test_donation_detail_includes_all_fields(self):
        """Test that donation detail endpoint includes all required fields."""
        self.client.force_authenticate(user=self.donor)
        response = self.client.get(f'/api/donations/{self.donation_1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_fields = [
            'id', 'donor', 'amount', 'currency', 'status', 'note', 'appeal',
            'payment_method', 'transaction_id', 'receipt_url', 'created_at', 'updated_at'
        ]
        
        for field in expected_fields:
            self.assertIn(field, response.data)

    def test_donation_creation_sets_donor_automatically(self):
        """Test that donation creation automatically sets the donor."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['donor']['id'], self.donor.id)

    def test_donation_with_note(self):
        """Test donation creation with a note."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': self.approved_appeal.id,
            'payment_method': 'stripe',
            'note': 'This is a test donation note'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['note'], 'This is a test donation note')

    def test_donation_with_different_currencies(self):
        """Test donation creation with different currencies."""
        self.client.force_authenticate(user=self.donor)
        
        currencies = ['PKR', 'USD', 'EUR']
        
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

    def test_donation_to_nonexistent_appeal(self):
        """Test donation creation with non-existent appeal ID."""
        self.client.force_authenticate(user=self.donor)
        
        donation_data = {
            'amount': '500.00',
            'currency': 'PKR',
            'appeal': 99999,  # Non-existent appeal
            'payment_method': 'stripe'
        }
        
        response = self.client.post('/api/donations/', donation_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('appeal', response.data) 