from django.db import models
from django.conf import settings

class Donation(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('stripe', 'Stripe'),
        ('jazzcash', 'JazzCash'),
        ('easypaisa', 'EasyPaisa'),
        ('bank_transfer', 'Bank Transfer'),
        ('manual', 'Manual'),
    ]
    DONATION_TYPE_CHOICES = [
        ('mawalat_al_qurba', 'Mawalat al-Qurba'),
        ('general', 'General Donation'),
        ('appeal_specific', 'Appeal Specific'),
    ]

    id = models.AutoField(primary_key=True)
    donor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='donations',
        on_delete=models.CASCADE,
        help_text='Must have role = Donor'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=8, default='PKR')
    donation_type = models.CharField(
        max_length=20, 
        choices=DONATION_TYPE_CHOICES, 
        default='mawalat_al_qurba',
        help_text='Type of donation'
    )
    appeal = models.ForeignKey(
        'appeals.Appeal',
        related_name='donations',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        help_text='Optional: Donor may or may not target a specific appeal.'
    )
    note = models.TextField(blank=True, null=True)

    # Status & Tracking
    payment_method = models.CharField(max_length=16, choices=PAYMENT_METHOD_CHOICES, blank=True, null=True)
    transaction_id = models.CharField(max_length=128, blank=True, null=True)
    receipt_url = models.URLField(blank=True, null=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'donations'
        verbose_name = 'Donation'
        verbose_name_plural = 'Donations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['donor', 'created_at']),
            models.Index(fields=['donation_type']),
        ]

    def __str__(self):
        return f"Donation {self.id} by {self.donor_id} - {self.amount} {self.currency}"

    # Business rules (to be enforced in serializer/service layer):
    # - Only users with role = Donor can create a donation
    # - If appeal is provided, it must have status = approved
    # - status = confirmed will trigger system wallet update logic
    # - Donor should not see other donors' data
