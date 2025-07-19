from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from wallet.models import Wallet, WalletTransaction
from users.models import User
from appeals.models import Appeal
from wallet.utils import generate_description, resolve_transfer_by

class AdminWalletAnalyticsTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email='admin@example.com', password='adminpass', role='admin', first_name='Admin', last_name='User', phone='1234567890'
        )
        self.recipient = User.objects.create_user(
            email='recipient@example.com', password='recipientpass', role='recipient', is_verified_syed=True, first_name='Recipient', last_name='User', phone='1234567891'
        )
        self.donor = User.objects.create_user(
            email='donor@example.com', password='donorpass', role='donor', first_name='Donor', last_name='User', phone='1234567892'
        )
        self.wallet = Wallet.objects.create(user=self.recipient, balance=10000)
        self.appeal = Appeal.objects.create(
            title='Medical Help',
            description='Help needed for surgery',
            category='medical',
            amount_requested=20000,
            created_by=self.recipient,
            beneficiary=self.recipient,
            status='fulfilled',
            approved_by=self.admin
        )
        WalletTransaction.objects.create(wallet=self.wallet, amount=15000, type='credit', description=generate_description('donation', self.appeal), transfer_by=resolve_transfer_by(self.donor), appeal=self.appeal)
        WalletTransaction.objects.create(wallet=self.wallet, amount=5000, type='debit', description=generate_description('withdrawal', self.appeal), transfer_by=resolve_transfer_by(self.recipient), appeal=self.appeal)
        self.client = APIClient()

    def test_admin_can_view_platform_overview(self):
        self.client.login(email='admin@example.com', password='adminpass')
        url = '/api/wallet/admin/overview/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_withdrawn_amount', response.data)
        self.assertIn('total_current_balance', response.data)
        self.client.logout()

    def test_non_admin_cannot_view_platform_overview(self):
        self.client.login(email='recipient@example.com', password='recipientpass')
        url = '/api/wallet/admin/overview/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.client.logout()

    def test_unauthenticated_cannot_view_platform_overview(self):
        url = '/api/wallet/admin/overview/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_view_recipients_list(self):
        self.client.login(email='admin@example.com', password='adminpass')
        url = '/api/wallet/admin/recipients/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertTrue(any(r['id'] == self.recipient.id for r in response.data['results']))
        self.client.logout()

    def test_admin_can_view_recipient_withdrawals(self):
        self.client.login(email='admin@example.com', password='adminpass')
        url = f'/api/wallet/admin/recipients/{self.recipient.id}/withdrawals/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.client.logout()

    def test_admin_can_view_recipient_transfers(self):
        self.client.login(email='admin@example.com', password='adminpass')
        url = f'/api/wallet/admin/recipients/{self.recipient.id}/transfers/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.client.logout()

    def test_invalid_recipient_returns_404(self):
        self.client.login(email='admin@example.com', password='adminpass')
        url = f'/api/wallet/admin/recipients/999999/withdrawals/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        url = f'/api/wallet/admin/recipients/999999/transfers/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.client.logout()

    def test_non_admin_cannot_view_recipients(self):
        self.client.login(email='recipient@example.com', password='recipientpass')
        url = '/api/wallet/admin/recipients/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.client.logout() 