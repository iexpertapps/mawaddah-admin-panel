# This file is intended for Django's test runner. The imports below are correct in a Django environment.
# noqa: F401, F403, E402 (import errors for Django are safe to ignore in Django projects)
from django.test import TestCase  # noqa: F401
from django.contrib.auth import get_user_model  # noqa: F401
from django.core.exceptions import ValidationError  # noqa: F401
from decimal import Decimal
from users.services import user_service

User = get_user_model()

class UserServiceTests(TestCase):
    """Tests for user service layer functions."""

    def setUp(self):
        """Set up test data for user service tests."""
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'phone': '1234567890',
            'role': 'user',
            'is_verified_syed': False,
            'country': 'Pakistan',
            'state': 'Test State',
            'city': 'Test City'
        }

    def test_create_verified_syed_user(self):
        """Test creation of a verified Syed recipient with proper validation."""
        # Test successful creation
        syed_data = self.user_data.copy()
        syed_data.update({
            'email': 'syed@example.com',
            'role': 'recipient',
            'is_verified_syed': True
        })
        
        user = user_service.create_user(syed_data)
        self.assertEqual(user.role, 'recipient')
        self.assertTrue(user.is_verified_syed)
        self.assertEqual(user.email, 'syed@example.com')

        # Test missing required fields
        invalid_data = self.user_data.copy()
        invalid_data.pop('email')
        
        with self.assertRaises(ValidationError):
            user_service.create_user(invalid_data)

    def test_update_user_profile_service(self):
        """Test user profile updates through service layer."""
        # Create initial user
        user = user_service.create_user(self.user_data)
        
        # Test valid updates
        update_data = {
            'first_name': 'Updated',
            'phone': '9876543210',
            'city': 'New City'
        }
        
        updated_user = user_service.update_user(user, update_data)
        self.assertEqual(updated_user.first_name, 'Updated')
        self.assertEqual(updated_user.phone, '9876543210')
        self.assertEqual(updated_user.city, 'New City')

        # Test invalid updates
        invalid_update = {'role': 'invalid_role'}
        with self.assertRaises(ValidationError):
            user_service.update_user(user, invalid_update)

    def test_get_user_by_email(self):
        """Test retrieving user by email address."""
        user = user_service.create_user(self.user_data)
        retrieved_user = user_service.get_user_by_email('test@example.com')
        self.assertEqual(retrieved_user.id, user.id)
        self.assertEqual(retrieved_user.email, user.email)

    def test_get_users_by_role(self):
        """Test filtering users by role."""
        # Create users with different roles
        user_service.create_user(self.user_data)
        
        donor_data = self.user_data.copy()
        donor_data.update({'email': 'donor@example.com', 'role': 'donor'})
        user_service.create_user(donor_data)
        
        recipients = user_service.get_users_by_role('recipient')
        donors = user_service.get_users_by_role('donor')
        
        self.assertEqual(recipients.count(), 0)
        self.assertEqual(donors.count(), 1)

    def test_get_verified_recipients(self):
        """Test retrieving only verified Syed recipients."""
        # Create verified recipient
        syed_data = self.user_data.copy()
        syed_data.update({
            'email': 'syed@example.com',
            'role': 'recipient',
            'is_verified_syed': True
        })
        user_service.create_user(syed_data)
        
        # Create unverified recipient
        unverified_data = self.user_data.copy()
        unverified_data.update({
            'email': 'unverified@example.com',
            'role': 'recipient',
            'is_verified_syed': False
        })
        user_service.create_user(unverified_data)
        
        verified_recipients = user_service.get_verified_recipients()
        self.assertEqual(verified_recipients.count(), 1)
        self.assertTrue(verified_recipients.first().is_verified_syed)

    def test_add_to_wallet(self):
        """Test adding funds to user wallet."""
        user = user_service.create_user(self.user_data)
        initial_balance = user.wallet_balance
        
        user_service.add_to_wallet(user, Decimal('100.00'))
        user.refresh_from_db()
        
        self.assertEqual(user.wallet_balance, initial_balance + Decimal('100.00'))

    def test_deduct_from_wallet(self):
        """Test deducting funds from user wallet."""
        user = user_service.create_user(self.user_data)
        user_service.add_to_wallet(user, Decimal('100.00'))
        
        user_service.deduct_from_wallet(user, Decimal('50.00'))
        user.refresh_from_db()
        
        self.assertEqual(user.wallet_balance, Decimal('50.00'))

    def test_verify_syed_status(self):
        """Test verifying a user as Syed."""
        # Create recipient
        recipient_data = self.user_data.copy()
        recipient_data.update({
            'email': 'recipient@example.com',
            'role': 'recipient',
            'is_verified_syed': False
        })
        user = user_service.create_user(recipient_data)
        
        # Verify Syed status
        verified_user = user_service.verify_syed_status(user)
        self.assertTrue(verified_user.is_verified_syed)

        # Test verification fails for non-recipients
        donor_data = self.user_data.copy()
        donor_data.update({
            'email': 'donor@example.com',
            'role': 'donor'
        })
        donor = user_service.create_user(donor_data)
        
        with self.assertRaises(ValidationError):
            user_service.verify_syed_status(donor)

    def test_update_withdrawal_details(self):
        """Test updating user withdrawal details."""
        user = user_service.create_user(self.user_data)
        
        # Test bank transfer details
        user_service.update_withdrawal_details(
            user, 'bank', 'Test Account', '1234567890', 'Test Bank'
        )
        user.refresh_from_db()
        
        self.assertEqual(user.withdraw_method, 'bank')
        self.assertEqual(user.account_title, 'Test Account')
        self.assertEqual(user.account_number, '1234567890')
        self.assertEqual(user.bank_name, 'Test Bank')

        # Test missing bank name for bank transfers
        with self.assertRaises(ValidationError):
            user_service.update_withdrawal_details(
                user, 'bank', 'Test Account', '1234567890', None
            )

    def test_can_submit_appeals(self):
        """Test checking if user can submit appeals."""
        # Create verified recipient
        syed_data = self.user_data.copy()
        syed_data.update({
            'email': 'syed@example.com',
            'role': 'recipient',
            'is_verified_syed': True
        })
        verified_user = user_service.create_user(syed_data)
        
        # Create unverified recipient
        unverified_data = self.user_data.copy()
        unverified_data.update({
            'email': 'unverified@example.com',
            'role': 'recipient',
            'is_verified_syed': False
        })
        unverified_user = user_service.create_user(unverified_data)
        
        self.assertTrue(user_service.can_submit_appeals(verified_user))
        self.assertFalse(user_service.can_submit_appeals(unverified_user))

    def test_get_user_statistics(self):
        """Test retrieving user statistics for admin dashboard."""
        # Create users with different roles
        user_service.create_user(self.user_data)
        
        donor_data = self.user_data.copy()
        donor_data.update({'email': 'donor@example.com', 'role': 'donor'})
        user_service.create_user(donor_data)
        
        syed_data = self.user_data.copy()
        syed_data.update({
            'email': 'syed@example.com',
            'role': 'recipient',
            'is_verified_syed': True
        })
        user_service.create_user(syed_data)
        
        stats = user_service.get_user_statistics()
        
        self.assertEqual(stats['total_users'], 3)
        self.assertEqual(stats['total_donors'], 1)
        self.assertEqual(stats['total_recipients'], 1)
        self.assertEqual(stats['verified_recipients'], 1)
        self.assertIsInstance(stats['total_wallet_balance'], Decimal)

    def test_delete_user_with_wallet_balance(self):
        """Test that users with wallet balance cannot be deleted."""
        user = user_service.create_user(self.user_data)
        user_service.add_to_wallet(user, Decimal('100.00'))
        
        with self.assertRaises(ValidationError):
            user_service.delete_user(user) 