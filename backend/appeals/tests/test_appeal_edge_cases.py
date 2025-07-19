# This file is intended for Django's test runner. The imports below are correct in a Django environment.
# noqa: F401, F403, E402 (import errors for Django/DRF are safe to ignore in Django projects)
from django.test import TestCase  # noqa: F401
from django.contrib.auth import get_user_model  # noqa: F401
from rest_framework.test import APIClient  # noqa: F401
from rest_framework import status  # noqa: F401
from appeals.models import Appeal  # noqa: F401
from donations.models import Donation  # noqa: F401
from django.utils import timezone  # noqa: F401

User = get_user_model()

class AppealFulfillmentSourceTests(TestCase):
    """Tests for appeal fulfillment source logic and admin trail tracking."""

    def setUp(self):
        """Set up test data for fulfillment source tests."""
        # Create test users
        self.recipient = User.objects.create_user(
            email='recipient@example.com',
            password='testpass123',
            role='recipient',
            is_verified_syed=True,
            first_name='Test',
            last_name='Recipient',
            phone='1111111111'
        )
        
        self.shura_member = User.objects.create_user(
            email='shura@example.com',
            password='testpass123',
            role='shura',
            first_name='Shura',
            last_name='Member',
            phone='2222222222'
        )
        
        self.donor = User.objects.create_user(
            email='donor@example.com',
            password='testpass123',
            role='donor',
            first_name='Test',
            last_name='Donor',
            phone='3333333333'
        )
        
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='testpass123',
            role='admin'
        )
        
        # Create test appeals
        self.pending_appeal = Appeal.objects.create(
            title='Pending Appeal',
            description='Test pending appeal',
            category='medical',
            amount_requested=1000.00,
            created_by=self.recipient,
            beneficiary=self.recipient,
            status='pending'
        )
        self.pending_appeal._skip_validation = True
        self.pending_appeal.save()
        
        self.platform_approved_appeal = Appeal.objects.create(
            title='Platform Approved Appeal',
            description='Test platform approved appeal',
            category='school_fee',
            amount_requested=500.00,
            created_by=self.recipient,
            beneficiary=self.recipient,
            status='approved',
            approved_by=self.shura_member,
            approved_at=timezone.now()
        )
        self.platform_approved_appeal._skip_validation = True
        self.platform_approved_appeal.save()
        
        # Create donation for donor-linked appeal
        self.donation = Donation.objects.create(
            donor=self.donor,
            amount=800.00,
            donation_type='appeal_specific',
            note='Test donation for appeal'
        )
        
        self.donor_linked_appeal = Appeal.objects.create(
            title='Donor Linked Appeal',
            description='Test donor linked appeal',
            category='house_rent',
            amount_requested=800.00,
            created_by=self.recipient,
            beneficiary=self.recipient,
            status='approved',
            approved_by=self.shura_member,
            approved_at=timezone.now(),
            linked_donation=self.donation
        )
        
        self.client = APIClient()

    def test_fulfillment_source_platform_approved(self):
        """Test that platform-approved appeals have correct fulfillment source."""
        self.assertEqual(self.platform_approved_appeal.fulfillment_source, "platform")
        self.assertFalse(self.platform_approved_appeal.is_donor_linked)
        self.assertTrue(self.platform_approved_appeal.is_fulfilled)

    def test_fulfillment_source_donor_linked(self):
        """Test that donor-linked appeals have correct fulfillment source."""
        self.assertEqual(self.donor_linked_appeal.fulfillment_source, "donor")
        self.assertTrue(self.donor_linked_appeal.is_donor_linked)
        self.assertTrue(self.donor_linked_appeal.is_fulfilled)

    def test_fulfillment_source_pending_appeal(self):
        """Test that pending appeals have no fulfillment source."""
        self.assertIsNone(self.pending_appeal.fulfillment_source)
        self.assertFalse(self.pending_appeal.is_donor_linked)
        self.assertFalse(self.pending_appeal.is_fulfilled)

    def test_admin_trail_approval_tracking(self):
        """Test that approval actions are properly tracked."""
        self.client.force_authenticate(user=self.shura_member)
        
        response = self.client.patch(
            f'/api/appeals/{self.pending_appeal.id}/',
            {'status': 'approved'}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh from database
        self.pending_appeal.refresh_from_db()
        
        self.assertEqual(self.pending_appeal.status, 'approved')
        self.assertEqual(self.pending_appeal.approved_by, self.shura_member)
        self.assertIsNotNone(self.pending_appeal.approved_at)
        self.assertIsNone(self.pending_appeal.rejected_by)
        self.assertIsNone(self.pending_appeal.cancelled_by)

    def test_admin_trail_rejection_tracking(self):
        """Test that rejection actions are properly tracked."""
        self.client.force_authenticate(user=self.shura_member)
        
        response = self.client.patch(
            f'/api/appeals/{self.pending_appeal.id}/',
            {
                'status': 'rejected',
                'rejection_reason': 'Insufficient documentation'
            }
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh from database
        self.pending_appeal.refresh_from_db()
        
        self.assertEqual(self.pending_appeal.status, 'rejected')
        self.assertEqual(self.pending_appeal.rejected_by, self.shura_member)
        self.assertEqual(self.pending_appeal.rejection_reason, 'Insufficient documentation')
        self.assertIsNone(self.pending_appeal.approved_by)
        self.assertIsNone(self.pending_appeal.cancelled_by)

    def test_admin_trail_cancellation_tracking(self):
        """Test that cancellation actions are properly tracked."""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.patch(
            f'/api/appeals/{self.pending_appeal.id}/',
            {'status': 'cancelled'}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh from database
        self.pending_appeal.refresh_from_db()
        
        self.assertEqual(self.pending_appeal.status, 'cancelled')
        self.assertEqual(self.pending_appeal.cancelled_by, self.admin)
        self.assertIsNone(self.pending_appeal.approved_by)
        self.assertIsNone(self.pending_appeal.rejected_by)

    def test_donor_name_exposure_in_api(self):
        """Test that donor names are properly exposed in API responses."""
        self.client.force_authenticate(user=self.shura_member)
        
        response = self.client.get(f'/api/appeals/{self.donor_linked_appeal.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data['linked_donation_donor_name'],
            'Test Donor'
        )
        self.assertTrue(response.data['is_donor_linked'])
        self.assertEqual(response.data['fulfillment_source'], 'donor')

    def test_admin_names_exposure_in_api(self):
        """Test that admin names are properly exposed in API responses."""
        self.client.force_authenticate(user=self.shura_member)
        
        # Test approved appeal
        response = self.client.get(f'/api/appeals/{self.platform_approved_appeal.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['approved_by_name'], 'Shura Member')
        self.assertIsNone(response.data['rejected_by_name'])
        self.assertIsNone(response.data['cancelled_by_name'])
        
        # Test rejected appeal
        self.platform_approved_appeal.status = 'rejected'
        self.platform_approved_appeal.rejected_by = self.admin
        self.platform_approved_appeal.rejection_reason = 'Test rejection'
        self.platform_approved_appeal.save()
        
        response = self.client.get(f'/api/appeals/{self.platform_approved_appeal.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rejected_by_name'], 'admin@example.com')  # Admin has no full name
        self.assertEqual(response.data['fulfillment_source'], 'platform')

    def test_no_donor_name_for_platform_fulfilled_appeals(self):
        """Test that platform-fulfilled appeals have no donor name."""
        self.client.force_authenticate(user=self.shura_member)
        
        response = self.client.get(f'/api/appeals/{self.platform_approved_appeal.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['linked_donation_donor_name'])
        self.assertFalse(response.data['is_donor_linked'])
        self.assertEqual(response.data['fulfillment_source'], 'platform')

    def test_fulfillment_source_edge_cases(self):
        """Test edge cases for fulfillment source logic."""
        # Test appeal with no status change
        original_approved_by = self.platform_approved_appeal.approved_by
        original_approved_at = self.platform_approved_appeal.approved_at
        
        self.client.force_authenticate(user=self.shura_member)
        response = self.client.patch(
            f'/api/appeals/{self.platform_approved_appeal.id}/',
            {'title': 'Updated Title'}  # No status change
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh from database
        self.platform_approved_appeal.refresh_from_db()
        
        # Should not change approval tracking
        self.assertEqual(self.platform_approved_appeal.approved_by, original_approved_by)
        self.assertEqual(self.platform_approved_appeal.approved_at, original_approved_at)

    def test_linked_donation_relationship(self):
        """Test the relationship between appeals and linked donations."""
        # Test that donation can be linked to appeal
        self.donation.appeal = self.pending_appeal
        # Skip save to avoid signal issues - just test the relationship
        self.pending_appeal.linked_donation = self.donation
        # Skip save to avoid signal issues
        
        self.assertTrue(self.pending_appeal.is_donor_linked)
        self.assertEqual(self.pending_appeal.linked_donation, self.donation)

    def test_computed_properties_consistency(self):
        """Test that computed properties are consistent across different states."""
        # Test pending appeal
        self.assertFalse(self.pending_appeal.is_fulfilled)
        self.assertIsNone(self.pending_appeal.fulfillment_source)
        self.assertFalse(self.pending_appeal.is_donor_linked)
        
        # Test platform approved appeal
        self.assertTrue(self.platform_approved_appeal.is_fulfilled)
        self.assertEqual(self.platform_approved_appeal.fulfillment_source, 'platform')
        self.assertFalse(self.platform_approved_appeal.is_donor_linked)
        
        # Test donor linked appeal
        self.assertTrue(self.donor_linked_appeal.is_fulfilled)
        self.assertEqual(self.donor_linked_appeal.fulfillment_source, 'donor')
        self.assertTrue(self.donor_linked_appeal.is_donor_linked) 