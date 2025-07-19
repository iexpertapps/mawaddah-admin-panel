from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User
from wallet.models import WalletTransaction
import random
from datetime import timedelta
from wallet.utils import generate_description, resolve_transfer_by

class Command(BaseCommand):
    help = 'Seed sample data for Wallet Admin Analytics (recipients, donors, wallet transactions)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding Wallet Admin Analytics sample data...'))

        # Create donors
        donor_ahmad, _ = User.objects.get_or_create(
            email='ahmad@example.com', defaults={
                'first_name': 'Ahmad', 'last_name': 'Khan', 'role': 'donor', 'is_active': True, 'phone': '+9200000001'
            })
        # No System user needed

        # Create recipients
        zainab, _ = User.objects.get_or_create(
            email='zainab@example.com', defaults={
                'first_name': 'Zainab', 'last_name': 'Fatima', 'role': 'recipient', 'is_active': True, 'phone': '+9200000002', 'is_verified_syed': True
            })
        ali, _ = User.objects.get_or_create(
            email='ali@example.com', defaults={
                'first_name': 'Ali', 'last_name': 'Raza', 'role': 'recipient', 'is_active': True, 'phone': '+9200000003', 'is_verified_syed': True
            })
        fatima, _ = User.objects.get_or_create(
            email='fatima@example.com', defaults={
                'first_name': 'Fatima', 'last_name': 'Noor', 'role': 'recipient', 'is_active': True, 'phone': '+9200000004', 'is_verified_syed': True
            })

        # Ensure each recipient has a wallet
        from wallet.models import Wallet
        for user in [zainab, ali, fatima]:
            if not hasattr(user, 'wallet'):
                Wallet.objects.create(user=user)

        # Create a dummy appeal for each recipient
        from appeals.models import Appeal
        def get_or_create_dummy_appeal(user, admin):
            appeal, _ = Appeal.objects.get_or_create(
                beneficiary=user,
                category='other',
                defaults={
                    'title': f'Dummy Appeal for {user.first_name}',
                    'description': 'Seeded for wallet analytics',
                    'amount_requested': 10000,
                    'created_by': admin,
                    'status': 'approved',
                }
            )
            return appeal
        admin_user = donor_ahmad  # Use Ahmad as admin/creator for simplicity
        zainab_appeal = get_or_create_dummy_appeal(zainab, admin_user)
        ali_appeal = get_or_create_dummy_appeal(ali, admin_user)
        fatima_appeal = get_or_create_dummy_appeal(fatima, admin_user)

        now = timezone.now()
        def days_ago(n):
            return now - timedelta(days=n)

        # Zainab Fatima
        WalletTransaction.objects.create(
            wallet=zainab.wallet, type='credit', amount=8000,
            donor=donor_ahmad, timestamp=days_ago(25),
            description=generate_description('donation', zainab_appeal),
            transfer_by=resolve_transfer_by(donor_ahmad),
            appeal=zainab_appeal
        )
        WalletTransaction.objects.create(
            wallet=zainab.wallet, type='credit', amount=5000,
            donor=None, timestamp=days_ago(20),
            description=generate_description('donation', zainab_appeal),
            transfer_by='System',
            appeal=zainab_appeal
        )
        WalletTransaction.objects.create(
            wallet=zainab.wallet, type='debit', amount=4000,
            donor=None, timestamp=days_ago(10),
            description=generate_description('withdrawal', zainab_appeal),
            transfer_by=resolve_transfer_by(zainab),
            appeal=zainab_appeal
        )
        WalletTransaction.objects.create(
            wallet=zainab.wallet, type='debit', amount=3000,
            donor=None, timestamp=days_ago(5),
            description=generate_description('withdrawal', zainab_appeal),
            transfer_by=resolve_transfer_by(zainab),
            appeal=zainab_appeal
        )

        # Ali Raza
        WalletTransaction.objects.create(
            wallet=ali.wallet, type='credit', amount=15000,
            donor=donor_ahmad, timestamp=days_ago(28),
            description=generate_description('donation', ali_appeal),
            transfer_by=resolve_transfer_by(donor_ahmad),
            appeal=ali_appeal
        )
        WalletTransaction.objects.create(
            wallet=ali.wallet, type='credit', amount=10000,
            donor=donor_ahmad, timestamp=days_ago(18),
            description=generate_description('donation', ali_appeal),
            transfer_by=resolve_transfer_by(donor_ahmad),
            appeal=ali_appeal
        )
        WalletTransaction.objects.create(
            wallet=ali.wallet, type='debit', amount=5000,
            donor=None, timestamp=days_ago(7),
            description=generate_description('withdrawal', ali_appeal),
            transfer_by=resolve_transfer_by(ali),
            appeal=ali_appeal
        )

        # Fatima Noor
        WalletTransaction.objects.create(
            wallet=fatima.wallet, type='credit', amount=3000,
            donor=None, timestamp=days_ago(12),
            description=generate_description('donation', fatima_appeal),
            transfer_by='System',
            appeal=fatima_appeal
        )
        # No withdrawals for Fatima

        self.stdout.write(self.style.SUCCESS('Sample data seeded successfully!')) 