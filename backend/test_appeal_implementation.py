#!/usr/bin/env python
"""
Test script to verify appeal implementation with new fields and functionality.
"""
import os
import sys
import django

# Setup Django first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mawaddah_backend.settings')
django.setup()

# Now import Django/DRF modules
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from appeals.models import Appeal
from appeals.serializers.appeal import AppealListSerializer, AppealDetailSerializer
from donations.models import Donation
from django.utils import timezone

User = get_user_model()

def test_appeal_implementation():
    """Test the appeal implementation with new fields."""
    print("🧪 Testing Appeal Implementation...")

    # Cleanup: delete all test users, appeals, and donations
    print("⚠️  Cleaning up users, appeals, and donations...")
    Appeal.objects.all().delete()
    Donation.objects.all().delete()
    User.objects.all().delete()
    print("   - Cleanup complete.")
    
    # Create test users with unique phone numbers
    recipient = User.objects.create_user(
        email='test_recipient@example.com',
        password='testpass123',
        role='recipient',
        is_verified_syed=True,
        first_name='Test',
        last_name='Recipient',
        phone='1000000001'
    )
    
    shura_member = User.objects.create_user(
        email='test_shura@example.com',
        password='testpass123',
        role='shura',
        first_name='Test',
        last_name='Shura',
        phone='1000000002'
    )
    
    donor = User.objects.create_user(
        email='test_donor@example.com',
        password='testpass123',
        role='donor',
        first_name='Test',
        last_name='Donor',
        phone='1000000003'
    )
    
    # Create test donation
    donation = Donation.objects.create(
        donor=donor,
        amount=1000.00,
        donation_type='appeal_specific',
        note='Test donation'
    )
    
    # Create test appeals
    pending_appeal = Appeal.objects.create(
        title='Test Pending Appeal',
        description='Test pending appeal',
        category='medical',
        amount_requested=1000.00,
        created_by=recipient,
        beneficiary=recipient,
        status='pending'
    )
    
    platform_appeal = Appeal.objects.create(
        title='Test Platform Appeal',
        description='Test platform approved appeal',
        category='school_fee',
        amount_requested=500.00,
        created_by=recipient,
        beneficiary=recipient,
        status='approved',
        approved_by=shura_member,
        approved_at=timezone.now()
    )
    
    donor_appeal = Appeal.objects.create(
        title='Test Donor Appeal',
        description='Test donor linked appeal',
        category='house_rent',
        amount_requested=800.00,
        created_by=recipient,
        beneficiary=recipient,
        status='approved',
        approved_by=shura_member,
        approved_at=timezone.now(),
        linked_donation=donation
    )
    
    # Test computed properties
    print("✅ Testing computed properties...")
    
    # Test pending appeal
    assert not pending_appeal.is_donor_linked
    assert not pending_appeal.is_fulfilled
    assert pending_appeal.fulfillment_source is None
    print("   - Pending appeal properties: PASS")
    
    # Test platform approved appeal
    assert not platform_appeal.is_donor_linked
    assert platform_appeal.is_fulfilled
    assert platform_appeal.fulfillment_source == "platform"
    print("   - Platform appeal properties: PASS")
    
    # Test donor linked appeal
    assert donor_appeal.is_donor_linked
    assert donor_appeal.is_fulfilled
    assert donor_appeal.fulfillment_source == "donor"
    print("   - Donor appeal properties: PASS")
    
    # Test serializers
    print("✅ Testing serializers...")
    
    # Test list serializer
    list_serializer = AppealListSerializer(donor_appeal)
    data = list_serializer.data
    
    # Check new fields are present
    assert 'is_donor_linked' in data
    assert 'fulfillment_source' in data
    assert 'linked_donation_donor_name' in data
    assert 'approved_by_name' in data
    assert 'rejected_by_name' in data
    assert 'cancelled_by_name' in data
    
    # Check values
    assert data['is_donor_linked'] is True
    assert data['fulfillment_source'] == 'donor'
    assert data['linked_donation_donor_name'] == 'Test Donor'
    assert data['approved_by_name'] == 'Test Shura'
    print("   - List serializer with new fields: PASS")
    
    # Test detail serializer
    detail_serializer = AppealDetailSerializer(donor_appeal)
    detail_data = detail_serializer.data
    
    # Check additional fields in detail serializer
    assert 'rejection_reason' in detail_data
    assert 'approved_at' in detail_data
    assert 'fulfilled_at' in detail_data
    assert 'expiry_date' in detail_data
    assert 'linked_donation' in detail_data
    assert 'rejected_by' in detail_data
    assert 'cancelled_by' in detail_data
    print("   - Detail serializer with additional fields: PASS")
    
    # Test action tracking
    print("✅ Testing action tracking...")
    
    # Test approval tracking
    pending_appeal.status = 'approved'
    pending_appeal.approved_by = shura_member
    pending_appeal.approved_at = timezone.now()
    pending_appeal.save()
    
    pending_appeal.refresh_from_db()
    assert pending_appeal.status == 'approved'
    assert pending_appeal.approved_by == shura_member
    assert pending_appeal.approved_at is not None
    print("   - Approval tracking: PASS")
    
    # Test rejection tracking
    platform_appeal.status = 'rejected'
    platform_appeal.rejected_by = shura_member
    platform_appeal.rejection_reason = 'Test rejection'
    platform_appeal.save()
    
    platform_appeal.refresh_from_db()
    assert platform_appeal.status == 'rejected'
    assert platform_appeal.rejected_by == shura_member
    assert platform_appeal.rejection_reason == 'Test rejection'
    print("   - Rejection tracking: PASS")
    
    # Test cancellation tracking
    admin_user = User.objects.create_superuser(
        email='test_admin@example.com',
        password='testpass123',
        role='admin',
        phone='1000000004'
    )
    
    donor_appeal.status = 'cancelled'
    donor_appeal.cancelled_by = admin_user
    donor_appeal.save()
    
    donor_appeal.refresh_from_db()
    assert donor_appeal.status == 'cancelled'
    assert donor_appeal.cancelled_by == admin_user
    print("   - Cancellation tracking: PASS")
    
    # Test serializer with updated data
    updated_serializer = AppealListSerializer(donor_appeal)
    updated_data = updated_serializer.data
    
    # Check that cancellation tracking works
    assert updated_data['cancelled_by_name'] is not None
    assert updated_data['fulfillment_source'] == 'donor'  # Should still be donor even when cancelled
    print("   - Serializer with updated action tracking: PASS")
    
    print("🎉 All tests passed! Appeal implementation is working correctly.")
    
    # Cleanup
    User.objects.all().delete()
    Appeal.objects.all().delete()
    Donation.objects.all().delete()

if __name__ == '__main__':
    test_appeal_implementation() 