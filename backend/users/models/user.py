from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for Mawaddah app supporting donors, recipients, shura members, and admins.
    """
    
    # Role choices
    ROLE_CHOICES = [
        ('user', 'User'),
        ('donor', 'Donor'),
        ('recipient', 'Recipient'),
        ('shura', 'Shura Member'),
        ('admin', 'Admin'),
    ]
    
    # Withdrawal method choices
    WITHDRAW_METHOD_CHOICES = [
        ('bank', 'Bank Transfer'),
        ('jazzcash', 'JazzCash'),
        ('easypaisa', 'EasyPaisa'),
    ]
    
    # Language choices
    LANGUAGE_CHOICES = [
        ("en", "English"),
        ("ur", "Urdu"),
    ]

    # Identity Fields
    email = models.EmailField(unique=True, verbose_name='Email Address')
    # TEMPORARY DEFAULT: Remove after initial migration
    phone = models.CharField(
        max_length=15,
        unique=True,
        verbose_name='Phone Number',
        default='0000000000',  # TODO: Remove default after initial migration
    )
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    
    # Role Management
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='user',
        verbose_name='User Role'
    )
    is_verified_syed = models.BooleanField(
        default=False,
        verbose_name='Verified Syed Status',
        help_text='Only verified Sadaat can submit Mawaddah appeals'
    )
    
    # Location & Account Info
    country = models.CharField(
        max_length=100,
        default='Pakistan',
        verbose_name='Country'
    )
    state = models.CharField(
        max_length=100,
        default='Unknown',
        verbose_name='State/Province'
    )
    # TEMPORARY DEFAULT: Remove after initial migration
    city = models.CharField(
        max_length=100,
        default='PlaceholderCity',  # TODO: Remove default after initial migration
        verbose_name='City'
    )
    
    # Withdrawal Details (conditionally required)
    withdraw_method = models.CharField(
        max_length=20,
        choices=WITHDRAW_METHOD_CHOICES,
        blank=True,
        null=True,
        verbose_name='Withdrawal Method'
    )
    account_title = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Account Title'
    )
    account_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Account Number'
    )
    bank_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Bank Name'
    )
    
    # Wallet Tracking
    wallet_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0.00)],
        verbose_name='Wallet Balance',
        help_text='Managed by system for incoming disbursements'
    )
    
    # Avatar
    avatar = models.ImageField(
        upload_to="uploads/avatars/",
        null=True,
        blank=True,
        verbose_name="Avatar"
    )
    # Language
    language = models.CharField(
        max_length=8,
        choices=LANGUAGE_CHOICES,
        default="en",
        blank=True,
        verbose_name="Language"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Updated At')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True, verbose_name="Date Joined")
    
    # Settings
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = UserManager()
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email
    
    def clean(self):
        """Custom validation rules"""
        super().clean()
        
        # Rule 1: If role is recipient, is_verified_syed must be True
        if self.role == 'recipient' and not self.is_verified_syed:
            raise ValidationError({
                'is_verified_syed': 'Recipients must be verified Sadaat.'
            })
        
        # Rule 2: If withdraw_method is set, validate related fields
        if self.withdraw_method:
            if not self.account_title:
                raise ValidationError({
                    'account_title': 'Account title is required when withdrawal method is specified.'
                })
            if not self.account_number:
                raise ValidationError({
                    'account_number': 'Account number is required when withdrawal method is specified.'
                })
            
            # Rule 3: Bank name is required only if withdraw_method is 'bank'
            if self.withdraw_method == 'bank' and not self.bank_name:
                raise ValidationError({
                    'bank_name': 'Bank name is required when withdrawal method is bank.'
                })
    
    def save(self, *args, **kwargs):
        """Override save to run validation"""
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def full_name(self):
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}".strip() or self.email
    
    @property
    def is_recipient(self):
        """Check if user is a recipient"""
        return self.role == 'recipient'
    
    @property
    def is_donor(self):
        """Check if user is a donor"""
        return self.role == 'donor'
    
    @property
    def is_shura(self):
        """Check if user is a shura member"""
        return self.role == 'shura'
    
    @property
    def can_submit_appeals(self):
        """Check if user can submit appeals (verified syed recipients)"""
        return self.is_recipient and self.is_verified_syed
    
    def add_to_wallet(self, amount):
        """Add amount to wallet balance (system method)"""
        if amount <= 0:
            raise ValueError("Amount must be positive")
        self.wallet_balance += amount
        self.save(update_fields=['wallet_balance', 'updated_at'])
    
    def deduct_from_wallet(self, amount):
        """Deduct amount from wallet balance (system method)"""
        if amount <= 0:
            raise ValueError("Amount must be positive")
        if self.wallet_balance < amount:
            raise ValueError("Insufficient wallet balance")
        self.wallet_balance -= amount
        self.save(update_fields=['wallet_balance', 'updated_at']) 