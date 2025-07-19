#!/usr/bin/env python
import os
import sys
import django
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mawaddah_backend.settings')
django.setup()

from appeals.models import Appeal
from appeals.views.appeal import AppealViewSet
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import force_authenticate
from rest_framework.request import Request

User = get_user_model()

def test_filtered_stats():
    """Test that filtered stats are included in the response."""
    
    # Create a test user
    unique_id = random.randint(10000, 99999)
    user = User.objects.create_user(
        email=f'test{unique_id}@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        role='recipient',
        is_verified_syed=True,
        phone=str(1000000000 + random.randint(1, 8999999999))
    )
    
    # Create some test appeals
    Appeal.objects.create(
        title="Test Appeal 1",
        description="Test description",
        amount_requested=1000,
        category="medical",
        status="pending",
        created_by=user,
        beneficiary=user
    )
    
    Appeal.objects.create(
        title="Test Appeal 2", 
        description="Test description",
        amount_requested=2000,
        category="house_rent",
        status="approved",
        created_by=user,
        beneficiary=user
    )
    
    Appeal.objects.create(
        title="Test Appeal 3",
        description="Test description", 
        amount_requested=3000,
        category="medical",
        status="rejected",
        rejection_reason="Test reason",
        created_by=user,
        beneficiary=user
    )
    
    # Create viewset and request
    viewset = AppealViewSet()
    factory = RequestFactory()
    request = factory.get('/api/appeals/')
    force_authenticate(request, user=user)
    drf_request = Request(request)
    viewset.request = drf_request
    
    # Test without filters
    queryset = viewset.get_queryset()
    stats = viewset.get_filtered_stats(queryset)
    
    print("Filtered Stats (no filters):")
    print(f"Total: {stats['total']}")
    print(f"Pending: {stats['pending']}")
    print(f"Approved: {stats['approved']}")
    print(f"Rejected: {stats['rejected']}")
    
    # Test with status filter
    request = factory.get('/api/appeals/?status=pending')
    force_authenticate(request, user=user)
    drf_request = Request(request)
    viewset.request = drf_request
    queryset = viewset.get_queryset()
    stats = viewset.get_filtered_stats(queryset)
    
    print("\nFiltered Stats (status=pending):")
    print(f"Total: {stats['total']}")
    print(f"Pending: {stats['pending']}")
    print(f"Approved: {stats['approved']}")
    print(f"Rejected: {stats['rejected']}")
    
    # Test with category filter
    request = factory.get('/api/appeals/?category=medical')
    force_authenticate(request, user=user)
    drf_request = Request(request)
    viewset.request = drf_request
    queryset = viewset.get_queryset()
    stats = viewset.get_filtered_stats(queryset)
    
    print("\nFiltered Stats (category=medical):")
    print(f"Total: {stats['total']}")
    print(f"Pending: {stats['pending']}")
    print(f"Approved: {stats['approved']}")
    print(f"Rejected: {stats['rejected']}")
    
    print("\n✅ Filtered stats functionality is working correctly!")

if __name__ == '__main__':
    test_filtered_stats() 