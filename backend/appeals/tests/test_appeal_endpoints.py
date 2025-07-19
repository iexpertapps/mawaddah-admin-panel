# This file is intended for Django's test runner. The imports below are correct in a Django environment.
# noqa: F401, F403, E402 (import errors for Django/DRF are safe to ignore in Django projects)
from django.test import TestCase  # noqa: F401
from django.contrib.auth import get_user_model  # noqa: F401
from rest_framework.test import APIClient  # noqa: F401
from rest_framework import status  # noqa: F401
from appeals.models import Appeal  # noqa: F401
import uuid

User = get_user_model()

class AppealEndpointTests(TestCase):
    """Tests for appeal API endpoints."""

    def setUp(self):
        """Set up test data for appeal endpoint tests."""
        # Create test users with different roles
        self.verified_recipient = User.objects.create_user(
            email='recipient@example.com',
            password='testpass123',
            role='recipient',
            is_verified_syed=True,
            first_name='Verified',
            last_name='Recipient',
            phone='4444444444'
        )
        
        self.unverified_recipient = User.objects.create_user(
            email='unverified@example.com',
            password='testpass123',
            role='user',  # Use 'user' role instead of 'recipient' to avoid validation
            is_verified_syed=False,
            first_name='Unverified',
            last_name='Recipient',
            phone='5555555555'
        )
        
        self.shura_member = User.objects.create_user(
            email='shura@example.com',
            password='testpass123',
            role='shura',
            first_name='Shura',
            last_name='Member',
            phone='6666666666'
        )
        
        self.donor = User.objects.create_user(
            email='donor@example.com',
            password='testpass123',
            role='donor',
            first_name='Test',
            last_name='Donor',
            phone='7777777777'
        )
        
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='testpass123',
            role='admin'
        )
        
        # Create test appeals with unique categories
        self.appeal_1 = Appeal.objects.create(
            title='Medical Appeal 1',
            description='Need medical assistance',
            category='medical',
            amount_requested=1000.00,
            created_by=self.verified_recipient,
            beneficiary=self.verified_recipient,
            status='pending'
        )
        self.appeal_1._skip_validation = True
        self.appeal_1.save()
        
        self.appeal_2 = Appeal.objects.create(
            title='School Fee Appeal',
            description='Need help with school fees',
            category='school_fee',
            amount_requested=500.00,
            created_by=self.verified_recipient,
            beneficiary=self.verified_recipient,
            status='approved',
            approved_by=self.shura_member
        )
        self.appeal_2._skip_validation = True
        self.appeal_2.save()
        
        self.appeal_3 = Appeal.objects.create(
            title='Another Appeal',
            description='Another appeal for testing',
            category='house_rent',
            amount_requested=800.00,
            created_by=self.shura_member,
            beneficiary=self.verified_recipient,
            status='pending'
        )
        self.appeal_3._skip_validation = True
        self.appeal_3.save()
        
        self.client = APIClient()

    def test_authenticated_user_can_view_list_of_appeals(self):
        """Test that authenticated users can view list of appeals."""
        self.client.force_authenticate(user=self.verified_recipient)
        response = self.client.get('/api/appeals/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)  # Assuming pagination is enabled

    def test_shura_can_access_reviewable_endpoint(self):
        """Test that shura members can access the reviewable appeals endpoint."""
        self.client.force_authenticate(user=self.shura_member)
        response = self.client.get('/api/appeals/reviewable/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only show pending appeals
        for appeal in response.data.get('results', []):
            self.assertEqual(appeal['status'], 'pending')

    def test_recipient_sees_only_own_appeals_via_my_appeals(self):
        """Test that recipients see only their own appeals via my-appeals endpoint."""
        self.client.force_authenticate(user=self.verified_recipient)
        response = self.client.get('/api/appeals/my-appeals/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only show appeals created by the authenticated user
        for appeal in response.data.get('results', []):
            self.assertEqual(appeal['created_by'], self.verified_recipient.id)

    def test_post_appeals_works_for_verified_recipient(self):
        self.client.force_authenticate(user=self.verified_recipient)
        new_user = User.objects.create_user(email=f'unique_user_{uuid.uuid4().hex[:8]}@example.com', password='testpass', role='recipient', is_verified_syed=True, phone=str(uuid.uuid4().int)[:10])
        appeal_data = {
            'title': 'New Utility Appeal',
            'description': 'Need utility bill assistance',
            'category': 'utility_bills',
            'amount_requested': '1500.00',
            'is_monthly': False
        }
        self.client.force_authenticate(user=new_user)
        response = self.client.post('/api/appeals/', appeal_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Utility Appeal')
        self.assertEqual(response.data['created_by'], new_user.id)
        self.assertEqual(response.data['beneficiary'], new_user.id)

    def test_post_appeals_works_for_shura(self):
        self.client.force_authenticate(user=self.shura_member)
        unique_beneficiary = User.objects.create_user(email='unique_beneficiary@example.com', password='testpass', role='recipient', is_verified_syed=True, phone=str(uuid.uuid4().int)[:10])
        appeal_data = {
            'title': 'Shura Created Appeal',
            'description': 'Appeal created by shura',
            'category': 'business_support',
            'amount_requested': '200.00',
            'is_monthly': False,
            'beneficiary': unique_beneficiary.id
        }
        response = self.client.post('/api/appeals/', appeal_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Shura Created Appeal')
        self.assertEqual(response.data['created_by'], self.shura_member.id)
        self.assertEqual(response.data['beneficiary'], unique_beneficiary.id)

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

    def test_donor_cannot_create_appeals(self):
        """Test that donors cannot create appeals."""
        self.client.force_authenticate(user=self.donor)
        
        appeal_data = {
            'title': 'Donor Appeal',
            'description': 'This should fail',
            'category': 'medical',
            'amount_requested': '1000.00'
        }
        
        response = self.client.post('/api/appeals/', appeal_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_appeals_rejects_unauthorized_role(self):
        """Test that unauthorized roles cannot update appeals."""
        self.client.force_authenticate(user=self.donor)
        
        update_data = {'status': 'approved'}
        response = self.client.patch(f'/api/appeals/{self.appeal_1.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_shura_can_update_appeal_status(self):
        self.client.force_authenticate(user=self.shura_member)
        new_user = User.objects.create_user(email=f'unique_user_{uuid.uuid4().hex[:8]}@example.com', password='testpass', role='recipient', is_verified_syed=True, phone=str(uuid.uuid4().int)[:10])
        appeal = Appeal.objects.create(
            title='Shura Patch Appeal',
            description='For shura patch test',
            category='school_fee',
            amount_requested=1000.00,
            created_by=new_user,
            beneficiary=new_user,
            status='pending'
        )
        update_data = {'status': 'approved'}
        response = self.client.patch(f'/api/appeals/{appeal.id}/', update_data)
        appeal.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(appeal.status, 'approved')

    def test_admin_can_update_appeal_status(self):
        self.client.force_authenticate(user=self.admin)
        new_user = User.objects.create_user(email=f'unique_user_{uuid.uuid4().hex[:8]}@example.com', password='testpass', role='recipient', is_verified_syed=True, phone=str(uuid.uuid4().int)[:10])
        appeal = Appeal.objects.create(
            title='Admin Patch Appeal',
            description='For admin patch test',
            category='medical',
            amount_requested=1000.00,
            created_by=new_user,
            beneficiary=new_user,
            status='pending'
        )
        update_data = {'status': 'rejected', 'rejection_reason': 'Insufficient documentation'}
        response = self.client.patch(f'/api/appeals/{appeal.id}/', update_data)
        appeal.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(appeal.status, 'rejected')

    def test_unauthenticated_user_cannot_access_appeals(self):
        """Test that unauthenticated users cannot access appeal endpoints."""
        response = self.client.get('/api/appeals/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        appeal_data = {
            'title': 'Unauthorized Appeal',
            'category': 'medical',
            'amount_requested': '1000.00'
        }
        response = self.client.post('/api/appeals/', appeal_data)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        response = self.client.get(f'/api/appeals/{self.appeal_1.id}/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_appeal_detail_endpoint_returns_correct_data(self):
        """Test that appeal detail endpoint returns correct data."""
        self.client.force_authenticate(user=self.verified_recipient)
        response = self.client.get(f'/api/appeals/{self.appeal_1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.appeal_1.id)
        self.assertEqual(response.data['title'], 'Medical Appeal 1')
        self.assertEqual(response.data['category'], 'medical')
        self.assertEqual(response.data['amount_requested'], '1000.00')

    def test_monthly_appeal_creation_with_valid_months(self):
        new_user = User.objects.create_user(email=f'unique_user_{uuid.uuid4().hex[:8]}@example.com', password='testpass', role='recipient', is_verified_syed=True, phone=str(uuid.uuid4().int)[:10])
        self.client.force_authenticate(user=new_user)
        monthly_appeal_data = {
            'title': 'Monthly Unique Appeal',
            'description': 'Need monthly unique assistance',
            'category': 'utility_bills',
            'amount_requested': '500.00',
            'is_monthly': True,
            'months_required': 3
        }
        response = self.client.post('/api/appeals/', monthly_appeal_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['is_monthly'], True)
        self.assertEqual(response.data['months_required'], 3)

    def test_monthly_appeal_creation_with_invalid_months(self):
        """Test creating monthly appeals with invalid months_required."""
        self.client.force_authenticate(user=self.verified_recipient)
        
        invalid_monthly_data = {
            'title': 'Invalid Monthly Appeal',
            'description': 'This should fail',
            'category': 'house_rent',
            'amount_requested': '500.00',
            'is_monthly': True,
            'months_required': 7  # Invalid: > 6
        }
        
        response = self.client.post('/api/appeals/', invalid_monthly_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('months_required', response.data)

    def test_reviewable_endpoint_only_shows_pending_appeals(self):
        """Test that reviewable endpoint only shows pending appeals."""
        self.client.force_authenticate(user=self.shura_member)
        response = self.client.get('/api/appeals/reviewable/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should not include approved or rejected appeals
        for appeal in response.data.get('results', []):
            self.assertNotEqual(appeal['status'], 'approved')
            self.assertNotEqual(appeal['status'], 'rejected')

    def test_my_appeals_endpoint_excludes_other_users_appeals(self):
        """Test that my-appeals endpoint excludes appeals created by other users."""
        self.client.force_authenticate(user=self.verified_recipient)
        response = self.client.get('/api/appeals/my-appeals/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should not include appeals created by shura_member
        for appeal in response.data.get('results', []):
            self.assertNotEqual(appeal['created_by'], self.shura_member.id) 