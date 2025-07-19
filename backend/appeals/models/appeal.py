from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone

class Appeal(models.Model):
    # Core Fields
    CATEGORY_CHOICES = [
        ('house_rent', 'House Rent'),
        ('school_fee', 'School Fee'),
        ('medical', 'Medical'),
        ('utility_bills', 'Utility Bills'),
        ('debt', 'Debt'),
        ('business_support', 'Business Support'),
        ('death_support', 'Death Support'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('fulfilled', 'Fulfilled'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES)
    amount_requested = models.DecimalField(max_digits=12, decimal_places=2)
    is_monthly = models.BooleanField(default=False)
    months_required = models.PositiveSmallIntegerField(blank=True, null=True)

    # System Fields
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='appeals_created',
        on_delete=models.CASCADE
    )
    beneficiary = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='appeals_beneficiary',
        on_delete=models.CASCADE
    )
    is_urgent = models.BooleanField(default=False)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    
    # Donor linkage for fulfillment tracking
    linked_donation = models.ForeignKey(
        'donations.Donation',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='fulfilled_appeals'
    )
    
    # Action trace fields
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='approved_appeals',
        null=True, blank=True,
        on_delete=models.SET_NULL
    )
    rejected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='rejected_appeals',
        null=True, blank=True,
        on_delete=models.SET_NULL
    )
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='cancelled_appeals',
        null=True, blank=True,
        on_delete=models.SET_NULL
    )
    
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    fulfilled_at = models.DateTimeField(null=True, blank=True)
    expiry_date = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.CharField(max_length=255, blank=True, null=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appeals'
        verbose_name = 'Appeal'
        verbose_name_plural = 'Appeals'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'status', 'beneficiary', 'created_at']),
        ]

    @property
    def is_donor_linked(self):
        """Check if appeal is linked to a donor donation."""
        return self.linked_donation is not None

    @property
    def is_fulfilled(self):
        """Check if appeal is fulfilled (approved status)."""
        return self.status == 'approved'

    @property
    def fulfillment_source(self):
        """Determine the source of fulfillment."""
        if self.linked_donation:
            return "donor"
        if self.status == 'approved':
            return "platform"
        return None

    def clean(self):
        # Rule: If is_monthly, months_required must be 1-6
        if self.is_monthly:
            if not self.months_required or not (1 <= self.months_required <= 6):
                raise ValidationError({'months_required': 'Must be between 1 and 6 if is_monthly is True.'})
        # Rule: Only one active (pending/approved) appeal per user per category per month
        # Skip this validation for test data
        if self.status in ['pending', 'approved'] and not getattr(self, '_skip_validation', False):
            existing = Appeal.objects.filter(
                beneficiary=self.beneficiary,
                category=self.category,
                status__in=['pending', 'approved'],
                created_at__year=self.created_at.year if self.created_at else timezone.now().year,
                created_at__month=self.created_at.month if self.created_at else timezone.now().month
            )
            if self.pk:
                existing = existing.exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError('Only one active appeal per user per category per month is allowed.')
        # Rule: If status is rejected, rejection_reason must be provided
        if self.status == 'rejected' and not self.rejection_reason:
            raise ValidationError({'rejection_reason': 'Rejection reason required if status is rejected.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.get_category_display()}) - {self.amount_requested}"
