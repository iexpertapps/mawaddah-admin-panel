import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from users.models import User  # Adjust if custom user model is elsewhere
from appeals.models import Appeal  # Adjust import path as needed
from donations.models import Donation  # Adjust import path as needed
from wallet.models import Wallet, WalletTransaction
from django.utils import timezone
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed sample data for dashboard testing'

    def handle(self, *args, **options):
        self.stdout.write('Seeding sample dashboard data...')

        # Create sample users
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@mawaddah.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )

        shura_user, created = User.objects.get_or_create(
            username='shura',
            defaults={
                'email': 'shura@mawaddah.com',
                'first_name': 'Shura',
                'last_name': 'Member',
                'role': 'shura',
            }
        )

        recipient_user, created = User.objects.get_or_create(
            username='recipient',
            defaults={
                'email': 'recipient@mawaddah.com',
                'first_name': 'Recipient',
                'last_name': 'User',
                'role': 'recipient',
            }
        )

        donor_user, created = User.objects.get_or_create(
            username='donor',
            defaults={
                'email': 'donor@mawaddah.com',
                'first_name': 'Donor',
                'last_name': 'User',
                'role': 'donor',
            }
        )

        # Create sample appeals
        appeal_titles = [
            'Medical Emergency Fund',
            'Education Support',
            'Housing Assistance',
            'Food Security',
            'Transportation Help',
            'Utility Bill Support',
            'Business Startup',
            'Debt Relief',
            'Wedding Expenses',
            'Funeral Costs'
        ]

        appeals = []
        for i, title in enumerate(appeal_titles):
            appeal, created = Appeal.objects.get_or_create(
                title=title,
                defaults={
                    'description': f'Sample appeal for {title.lower()}',
                    'target_amount': Decimal(str(random.randint(50000, 500000))),
                    'status': random.choice(['active', 'completed', 'cancelled']),
                    'created_by': recipient_user,
                    'created_at': timezone.now() - timezone.timedelta(days=random.randint(1, 30)),
                }
            )
            appeals.append(appeal)

        # Create sample donations
        for appeal in appeals:
            num_donations = random.randint(3, 8)
            for _ in range(num_donations):
                Donation.objects.get_or_create(
                    appeal=appeal,
                    donor=donor_user,
                    amount=Decimal(str(random.randint(1000, 50000))),
                    defaults={
                        'donation_type': random.choice(['cash', 'bank_transfer', 'mobile_money']),
                        'status': random.choice(['completed', 'pending', 'failed']),
                        'created_at': timezone.now() - timezone.timedelta(days=random.randint(1, 20)),
                    }
                )

        # Create sample wallets and transactions
        wallet, created = Wallet.objects.get_or_create(
            user=recipient_user,
            defaults={'balance': Decimal('0.00')}
        )

        # Create sample wallet transactions
        transaction_types = ['credit', 'debit']
        descriptions = [
            'Donation received',
            'Withdrawal processed',
            'Appeal funding',
            'Emergency disbursement',
            'Monthly allowance'
        ]

        for i in range(15):
            transaction_type = random.choice(transaction_types)
            amount = Decimal(str(random.randint(1000, 50000)))
            
            WalletTransaction.objects.get_or_create(
                wallet=wallet,
                amount=amount,
                transaction_type=transaction_type,
                description=random.choice(descriptions),
                defaults={
                    'status': random.choice(['completed', 'pending', 'failed']),
                    'created_at': timezone.now() - timezone.timedelta(days=random.randint(1, 30)),
                }
            )

        self.stdout.write(
            self.style.SUCCESS('Successfully seeded sample dashboard data')
        ) 