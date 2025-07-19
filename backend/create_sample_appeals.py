#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mawaddah_backend.settings')
django.setup()

from users.models import User
from appeals.models import Appeal

def create_sample_appeals():
    """Create sample appeals for testing."""
    
    # Get or create test users
    admin_user, _ = User.objects.get_or_create(
        email='admin@mawadah.com',
        defaults={
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'admin',
            'phone': '1234567890'
        }
    )
    
    recipient_user, _ = User.objects.get_or_create(
        email='recipient@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'Recipient',
            'role': 'recipient',
            'is_verified_syed': True,
            'phone': '1234567891'
        }
    )
    
    shura_user, _ = User.objects.get_or_create(
        email='shura@example.com',
        defaults={
            'first_name': 'Shura',
            'last_name': 'Member',
            'role': 'shura',
            'phone': '1234567892'
        }
    )
    
    # Create sample appeals
    appeals_data = [
        {
            'title': 'Medical Assistance Needed',
            'description': 'Need help with medical bills for surgery',
            'category': 'medical',
            'amount_requested': 2500.00,
            'status': 'pending',
            'created_by': recipient_user,
            'beneficiary': recipient_user,
        },
        {
            'title': 'School Fees Support',
            'description': 'Unable to pay school fees for children',
            'category': 'school_fee',
            'amount_requested': 800.00,
            'status': 'approved',
            'created_by': recipient_user,
            'beneficiary': recipient_user,
            'approved_by': shura_user,
            'approved_at': timezone.now() - timedelta(days=2),
        },
        {
            'title': 'House Rent Support',
            'description': 'Need help with house rent payment',
            'category': 'house_rent',
            'amount_requested': 1500.00,
            'status': 'rejected',
            'created_by': recipient_user,
            'beneficiary': recipient_user,
            'rejected_by': shura_user,
            'rejection_reason': 'Insufficient documentation provided',
        },
        {
            'title': 'Utility Bills Support',
            'description': 'Need help with electricity and water bills',
            'category': 'utility_bills',
            'amount_requested': 300.00,
            'status': 'pending',
            'created_by': recipient_user,
            'beneficiary': recipient_user,
        }
    ]
    
    created_count = 0
    for appeal_data in appeals_data:
        appeal, created = Appeal.objects.get_or_create(
            title=appeal_data['title'],
            defaults=appeal_data
        )
        if created:
            created_count += 1
            print(f"Created appeal: {appeal.title}")
    
    print(f"\nCreated {created_count} new appeals. Total appeals: {Appeal.objects.count()}")

if __name__ == '__main__':
    create_sample_appeals() 