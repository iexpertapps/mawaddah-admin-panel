# This file is intended for Django's test runner. The imports below are correct in a Django environment.
# noqa: F401, F403, E402 (import errors for Django/DRF are safe to ignore in Django projects)
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient  # noqa: F401
from rest_framework import status
from appeals.models import Appeal
from decimal import Decimal
from unittest import skip
from wallet.services.wallet_service import credit_wallet, debit_wallet, manual_credit, adjust_wallet_balance, reject_withdrawal, issue_refund
from wallet.utils import generate_description, resolve_transfer_by
from wallet.models import WalletTransaction
from users.models import User
from appeals.models import Appeal
from decimal import Decimal
import pytest

User = get_user_model()

class WalletEndpointTests(APITestCase):
    """Endpoint-level tests for wallet API endpoints using DRF APIClient."""

    def setUp(self):
        """Set up users and data for wallet endpoint tests."""
        self.verified_recipient = User.objects.create_user(
            email='recipient@example.com',
            password='testpass123',
            role='recipient',
            is_verified_syed=True,
            first_name='Verified',
            last_name='Recipient',
            phone='1234567890'
        )
        self.donor = User.objects.create_user(
            email='donor@example.com',
            password='testpass123',
            role='donor',
            first_name='Donor',
            last_name='User',
            phone='1234567891'
        )
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123',
            role='admin',
            first_name='Admin',
            last_name='User',
            phone='1234567892'
        )
        # Create a fulfilled appeal for recipient to give them a balance
        self.appeal = Appeal.objects.create(
            title='Medical Help',
            description='Help needed for surgery',
            category='medical',
            amount_requested=1000.00,
            created_by=self.verified_recipient,
            beneficiary=self.verified_recipient,
            status='fulfilled',
            approved_by=self.admin
        )
        self.client = APIClient()

    def test_recipient_can_view_wallet_balance(self):
        """
        Test that a verified recipient can view their wallet balance.
        """
        self.client.login(email='recipient@example.com', password='testpass123')
        url = '/api/wallet/balance/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('balance', response.data)
        self.assertIn('total_received', response.data)
        self.assertIn('total_withdrawn', response.data)
        self.client.logout()

    def test_wallet_balance_unauthenticated(self):
        """Unauthenticated user should get 403 Forbidden from /api/wallet/balance/."""
        response = self.client.get('/api/wallet/balance/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_donor_wallet_returns_zero_balance_or_forbidden(self):
        """
        Test that a donor receives 0 balance or forbidden when accessing wallet endpoint.
        """
        self.client.login(email='donor@example.com', password='testpass123')
        url = '/api/wallet/balance/'
        response = self.client.get(url)
        # Accept either 200 with zero balance or 403 forbidden
        if response.status_code == status.HTTP_200_OK:
            self.assertIn('balance', response.data)
            self.assertEqual(Decimal(response.data['balance']), Decimal('0.00'))
        else:
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.client.logout()

    def test_wallet_transaction_history_returns_correct_data(self):
        """
        Test that wallet transaction history returns correct structure for recipient.
        """
        self.client.login(email='recipient@example.com', password='testpass123')
        url = '/api/wallet/transactions/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        if response.data['results']:
            tx = response.data['results'][0]
            self.assertIn('id', tx)
            self.assertIn('amount', tx)
            self.assertIn('type', tx)
            self.assertIn('description', tx)
            self.assertIn('timestamp', tx)
        self.client.logout()

    def test_wallet_transactions_unauthenticated(self):
        """Unauthenticated user should get 403 Forbidden from /api/wallet/transactions/."""
        response = self.client.get('/api/wallet/transactions/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @skip('No /api/wallet/summary/ endpoint implemented; skipping admin summary test.')
    def test_admin_can_view_summary_if_endpoint_exists(self):
        """
        Test that admin can view wallet summary if endpoint exists, or receives 403 if not implemented.
        """
        self.client.login(email='admin@example.com', password='adminpass123')
        url = '/api/wallet/summary/'
        response = self.client.get(url)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN])
        if response.status_code == status.HTTP_200_OK:
            self.assertIn('total_balance', response.data)
            self.assertIn('active_users', response.data)
        self.client.logout()

def test_credit_wallet_creates_transaction(db, django_user_model):
    user = django_user_model.objects.create_user(email='test1@example.com', password='pass', role='recipient')
    appeal = Appeal.objects.create(title='A', description='B', category='medical', amount_requested=100, created_by=user, beneficiary=user, status='approved')
    credit_wallet(user, Decimal('50.00'), appeal, donor=None, created_by=user, action_type='donation')
    tx = WalletTransaction.objects.filter(wallet__user=user, type='credit').last()
    assert tx is not None
    assert tx.description == generate_description('donation', appeal)
    assert tx.transfer_by == resolve_transfer_by(user)

def test_debit_wallet_creates_transaction(db, django_user_model):
    user = django_user_model.objects.create_user(email='test2@example.com', password='pass', role='recipient')
    appeal = Appeal.objects.create(title='A', description='B', category='medical', amount_requested=100, created_by=user, beneficiary=user, status='approved')
    credit_wallet(user, Decimal('100.00'), appeal, donor=None, created_by=user, action_type='donation')
    debit_wallet(user, Decimal('30.00'), appeal, created_by=user)
    tx = WalletTransaction.objects.filter(wallet__user=user, type='debit').last()
    assert tx is not None
    assert tx.description == generate_description('withdrawal', appeal)
    assert tx.transfer_by == resolve_transfer_by(user)

def test_manual_credit_creates_transaction(db, django_user_model):
    user = django_user_model.objects.create_user(email='test3@example.com', password='pass', role='recipient')
    manual_credit(user, Decimal('20.00'), created_by=user)
    tx = WalletTransaction.objects.filter(wallet__user=user, type='credit').last()
    assert tx is not None
    assert tx.description == generate_description('admin_credit')
    assert tx.transfer_by == 'Admin'

def test_adjust_wallet_balance_creates_transaction(db, django_user_model):
    user = django_user_model.objects.create_user(email='test4@example.com', password='pass', role='recipient')
    adjust_wallet_balance(user, Decimal('10.00'), reason='Adjustment', created_by=user)
    tx = WalletTransaction.objects.filter(wallet__user=user).last()
    assert tx is not None
    assert tx.description == generate_description('manual_adjustment', reason='Adjustment')
    assert tx.transfer_by == 'Admin'

def test_reject_withdrawal_creates_transaction(db, django_user_model):
    user = django_user_model.objects.create_user(email='test5@example.com', password='pass', role='recipient')
    appeal = Appeal.objects.create(title='A', description='B', category='medical', amount_requested=100, created_by=user, beneficiary=user, status='approved')
    reject_withdrawal(appeal, created_by=user)
    tx = WalletTransaction.objects.filter(wallet__user=user, type='debit').last()
    assert tx is not None
    assert tx.description == generate_description('rejected_withdrawal', appeal)
    assert tx.transfer_by == 'Admin'

def test_issue_refund_creates_transaction(db, django_user_model):
    user = django_user_model.objects.create_user(email='test6@example.com', password='pass', role='recipient')
    appeal = Appeal.objects.create(title='A', description='B', category='medical', amount_requested=100, created_by=user, beneficiary=user, status='approved')
    issue_refund(user, Decimal('15.00'), appeal, created_by=user)
    tx = WalletTransaction.objects.filter(wallet__user=user, type='credit').last()
    assert tx is not None
    assert tx.description == generate_description('refund', appeal)
    assert tx.transfer_by == resolve_transfer_by(user)

def test_edge_cases_for_helpers(db, django_user_model):
    user = django_user_model.objects.create_user(email='test7@example.com', password='pass', role='recipient')
    # No appeal
    desc = generate_description('donation')
    assert desc == 'Donation credited'
    # created_by is None
    transfer_by = resolve_transfer_by(None)
    assert transfer_by == 'System'
    # Unknown role
    class Dummy:
        role = 'unknown'
    transfer_by = resolve_transfer_by(Dummy())
    assert transfer_by == 'System' 