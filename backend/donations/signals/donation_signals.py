from django.db.models.signals import post_save
from django.dispatch import receiver
from donations.models import Donation
from donations.services.wallet_service import WalletService
import logging
from datetime import datetime

@receiver(post_save, sender=Donation)
def donation_confirmed_handler(sender, instance, created, **kwargs):
    """No-op: status logic removed from Donation model."""
    pass
