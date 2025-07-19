# This file is intended for Django's test runner. The imports below are correct in a Django environment.

# noqa: F401, F403, E402 (import errors for Django/DRF are safe to ignore in Django projects)
from django.test import TestCase  # noqa: F401
from django.contrib.auth import get_user_model  # noqa: F401
from rest_framework.test import APIClient  # noqa: F401
from rest_framework import status  # noqa: F401
from appeals.models import Appeal  # noqa: F401
from appeals.permissions.appeal_permissions import (  # noqa: F401
    IsVerifiedRecipientOrShura, IsShuraApprover, IsOwnerOrReadOnly
)
import uuid

User = get_user_model()

class AppealPermissionTests(TestCase):
    """Tests for appeal permission and access control."""

    def setUp(self):
        """Set up test data for appeal permission tests."""
        # Create test users with different roles
        self.verified_recipient = User.objects.create_user(
            email='recipient@example.com',
            password='testpass123',
            role='recipient',
            is_verified_syed=True,
            first_name='Verified',
            last_name='Recipient',
            phone='8888888888'
        )
        
        self.unverified_recipient = User.objects.create_user(
            email='unverified@example.com',
            password='testpass123',
            role='user',  # Use 'user' role instead of 'recipient' to avoid validation
            is_verified_syed=False,
            first_name='Unverified',
            last_name='Recipient',
            phone='9999999999'
        )
        
        self.shura_member = User.objects.create_user(
            email='shura@example.com',
            password='testpass123',
            role='shura',
            first_name='Shura',
            last_name='Member',
            phone='1010101010'
        )
        
        self.donor = User.objects.create_user(
            email='donor@example.com',
            password='testpass123',
            role='donor',
            first_name='Test',
            last_name='Donor',
            phone='1212121212'
        )
        
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='testpass123',
            role='admin'
        )
        
        # Create test appeals
        self.recipient_appeal = Appeal.objects.create(
            title='Recipient Appeal',
            description='Appeal created by recipient',
            category='medical',
            amount_requested=1000.00,
            created_by=self.verified_recipient,
            beneficiary=self.verified_recipient,
            status='pending'
        )
        self.recipient_appeal._skip_validation = True
        self.recipient_appeal.save()
        
        self.shura_appeal = Appeal.objects.create(
            title='Shura Appeal',
            description='Appeal created by shura',
            category='school_fee',
            amount_requested=500.00,
            created_by=self.shura_member,
            beneficiary=self.verified_recipient,
            status='pending'
        )
        self.shura_appeal._skip_validation = True
        self.shura_appeal.save()
        
        self.client = APIClient()

    def test_only_shura_can_approve_reject_appeals(self):
        """Test that only Shura members can approve/reject appeals."""
        # Test that recipient cannot approve appeals
        self.client.force_authenticate(user=self.verified_recipient)
        update_data = {'status': 'approved'}
        response = self.client.patch(f'/api/appeals/{self.recipient_appeal.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test that donor cannot approve appeals
        self.client.force_authenticate(user=self.donor)
        response = self.client.patch(f'/api/appeals/{self.recipient_appeal.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test that shura can approve appeals
        self.client.force_authenticate(user=self.shura_member)
        response = self.client.patch(f'/api/appeals/{self.recipient_appeal.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test that admin can approve appeals
        self.client.force_authenticate(user=self.admin)
        update_data = {'status': 'rejected', 'rejection_reason': 'Insufficient documentation'}
        response = self.client.patch(f'/api/appeals/{self.shura_appeal.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_only_creator_can_edit_in_review_appeal(self):
        """Test that only the creator can edit an appeal that is in review."""
        # Test that creator can edit their own appeal
        self.client.force_authenticate(user=self.verified_recipient)
        update_data = {'title': 'Updated Title'}
        response = self.client.patch(f'/api/appeals/{self.recipient_appeal.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test that other users cannot edit the appeal
        self.client.force_authenticate(user=self.donor)
        response = self.client.patch(f'/api/appeals/{self.recipient_appeal.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_override_status(self):
        """Test that admin can override appeal status."""
        self.client.force_authenticate(user=self.admin)
        
        # Test admin can approve
        update_data = {'status': 'approved'}
        response = self.client.patch(f'/api/appeals/{self.recipient_appeal.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test admin can reject
        update_data = {'status': 'rejected', 'rejection_reason': 'Admin rejection'}
        response = self.client.patch(f'/api/appeals/{self.recipient_appeal.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthenticated_users_get_401_on_all_endpoints(self):
        """Test that unauthenticated users get 401 or 403 on all appeal endpoints (DRF default is 403)."""
        response = self.client.get('/api/appeals/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        response = self.client.post('/api/appeals/', {})
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        response = self.client.get('/api/appeals/1/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_is_verified_recipient_or_shura_permission(self):
        """Test IsVerifiedRecipientOrShura permission logic."""
        permission = IsVerifiedRecipientOrShura()
        
        # Create mock request objects
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        class MockView:
            pass
        
        # Test verified recipient can create appeals
        verified_request = MockRequest(self.verified_recipient)
        self.assertTrue(permission.has_permission(verified_request, MockView()))
        
        # Test unverified recipient cannot create appeals
        unverified_request = MockRequest(self.unverified_recipient)
        self.assertFalse(permission.has_permission(unverified_request, MockView()))
        
        # Test shura can create appeals
        shura_request = MockRequest(self.shura_member)
        self.assertTrue(permission.has_permission(shura_request, MockView()))
        
        # Test admin can create appeals
        admin_request = MockRequest(self.admin)
        self.assertTrue(permission.has_permission(admin_request, MockView()))
        
        # Test donor cannot create appeals
        donor_request = MockRequest(self.donor)
        self.assertFalse(permission.has_permission(donor_request, MockView()))

    def test_is_shura_approver_permission(self):
        """Test IsShuraApprover permission logic."""
        permission = IsShuraApprover()
        
        # Create mock request objects
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        class MockView:
            pass
        
        # Test shura can approve appeals
        shura_request = MockRequest(self.shura_member)
        self.assertTrue(permission.has_permission(shura_request, MockView()))
        
        # Test admin can approve appeals
        admin_request = MockRequest(self.admin)
        self.assertTrue(permission.has_permission(admin_request, MockView()))
        
        # Test recipient cannot approve appeals
        recipient_request = MockRequest(self.verified_recipient)
        self.assertFalse(permission.has_permission(recipient_request, MockView()))
        
        # Test donor cannot approve appeals
        donor_request = MockRequest(self.donor)
        self.assertFalse(permission.has_permission(donor_request, MockView()))

    def test_is_owner_or_read_only_permission(self):
        """Test IsOwnerOrReadOnly permission logic."""
        permission = IsOwnerOrReadOnly()
        class MockRequest:
            def __init__(self, method, user):
                self.method = method
                self.user = user
        class MockView:
            pass
        # Authenticated user, owner
        request = MockRequest('GET', self.recipient_appeal.created_by)
        self.assertTrue(permission.has_object_permission(request, MockView(), self.recipient_appeal))
        # Authenticated user, not owner
        request = MockRequest('GET', self.donor)
        self.assertTrue(permission.has_object_permission(request, MockView(), self.recipient_appeal))
        # Unauthenticated user
        request = MockRequest('GET', None)
        self.assertFalse(permission.has_object_permission(request, MockView(), self.recipient_appeal))

    def test_rejection_requires_reason(self):
        """Test that rejection requires a rejection reason."""
        self.client.force_authenticate(user=self.shura_member)
        new_user = User.objects.create_user(email=f'unique_user_{uuid.uuid4().hex[:8]}@example.com', password='testpass', role='recipient', is_verified_syed=True, phone=str(uuid.uuid4().int)[:10])
        appeal = Appeal.objects.create(
            title='Rejection Patch Appeal',
            description='For rejection patch test',
            category='utility_bills',
            amount_requested=1000.00,
            created_by=new_user,
            beneficiary=new_user,
            status='pending'
        )
        update_data = {'status': 'rejected'}
        response = self.client.patch(f'/api/appeals/{appeal.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test rejection with reason should succeed
        update_data = {'status': 'rejected', 'rejection_reason': 'Insufficient documentation'}
        response = self.client.patch(f'/api/appeals/{appeal.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_approval_sets_approved_by_and_approved_at(self):
        """Test that approval sets approved_by and approved_at fields."""
        self.client.force_authenticate(user=self.shura_member)
        new_user = User.objects.create_user(email=f'unique_user_{uuid.uuid4().hex[:8]}@example.com', password='testpass', role='recipient', is_verified_syed=True, phone=str(uuid.uuid4().int)[:10])
        appeal = Appeal.objects.create(
            title='Approval Patch Appeal',
            description='For approval patch test',
            category='utility_bills',
            amount_requested=1000.00,
            created_by=new_user,
            beneficiary=new_user,
            status='pending'
        )
        update_data = {'status': 'approved'}
        response = self.client.patch(f'/api/appeals/{appeal.id}/', update_data)
        appeal.refresh_from_db()
        self.assertEqual(appeal.approved_by, self.shura_member)
        self.assertIsNotNone(appeal.approved_at)

    def test_urgent_flag_can_only_be_set_by_shura_or_admin(self):
        """Test that urgent flag can only be set by shura or admin."""
        # Test that recipient cannot set urgent flag
        self.client.force_authenticate(user=self.verified_recipient)
        update_data = {'is_urgent': True}
        response = self.client.patch(f'/api/appeals/{self.recipient_appeal.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test that shura can set urgent flag
        self.client.force_authenticate(user=self.shura_member)
        update_data = {'is_urgent': True}
        response = self.client.patch(f'/api/appeals/{self.recipient_appeal.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test that admin can set urgent flag
        self.client.force_authenticate(user=self.admin)
        update_data = {'is_urgent': False}
        response = self.client.patch(f'/api/appeals/{self.recipient_appeal.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verified_recipient_can_create_appeals(self):
        """Test that verified recipients can create appeals."""
        self.client.force_authenticate(user=self.verified_recipient)
        
        appeal_data = {
            'title': 'New Appeal',
            'description': 'Test appeal',
            'category': 'medical',
            'amount_requested': '1000.00'
        }
        
        response = self.client.post('/api/appeals/', appeal_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_unverified_recipient_cannot_create_appeals(self):
        """Test that unverified recipients cannot create appeals."""
        self.client.force_authenticate(user=self.unverified_recipient)
        
        appeal_data = {
            'title': 'Unauthorized Appeal',
            'description': 'This should fail',
            'category': 'medical',
            'amount_requested': '1000.00'
        }
        
        response = self.client.post('/api/appeals/', appeal_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_shura_can_create_appeals_for_others(self):
        self.client.force_authenticate(user=self.shura_member)
        unique_beneficiary = User.objects.create_user(email=f'unique_perm_beneficiary_{uuid.uuid4().hex[:8]}@example.com', password='testpass', role='recipient', is_verified_syed=True, phone=str(uuid.uuid4().int)[:10])
        appeal_data = {
            'title': 'Shura Created Appeal',
            'description': 'Appeal created by shura',
            'category': 'house_rent',
            'amount_requested': '200.00',
            'is_monthly': False,
            'beneficiary': unique_beneficiary.id
        }
        response = self.client.post('/api/appeals/', appeal_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['beneficiary'], unique_beneficiary.id) 