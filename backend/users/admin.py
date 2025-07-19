from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from users.models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Custom admin interface for User model with all Mawaddah app fields.
    """
    list_display = (
        'email', 'full_name', 'role', 'is_verified_syed',
        'country', 'state', 'city', 'wallet_balance', 'created_at'
    )
    list_filter = (
        'role', 'is_verified_syed', 'is_superuser',
        'country', 'withdraw_method', 'created_at'
    )
    search_fields = (
        'email', 'first_name', 'last_name', 'phone',
        'account_title', 'account_number'
    )
    ordering = ('-created_at',)
    readonly_fields = ('wallet_balance', 'created_at', 'updated_at', 'full_name')
    
    fieldsets = (
        ('Authentication', {
            'fields': ('email', 'password')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'phone', 'full_name')
        }),
        ('Role & Status', {
            'fields': ('role', 'is_verified_syed', 'is_superuser')
        }),
        ('Location', {
            'fields': ('country', 'state', 'city')
        }),
        ('Withdrawal Details', {
            'fields': ('withdraw_method', 'account_title', 'account_number', 'bank_name'),
            'classes': ('collapse',)
        }),
        ('Wallet & System', {
            'fields': ('wallet_balance', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Permissions', {
            'fields': ('groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'phone', 'first_name', 'last_name',
                'role', 'is_verified_syed', 'country', 'state', 'city',
                'password1', 'password2'
            ),
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset for admin performance"""
        return super().get_queryset(request).select_related()
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of users with wallet balance"""
        if obj and obj.wallet_balance > 0:
            return False
        return super().has_delete_permission(request, obj)
    
    def get_readonly_fields(self, request, obj=None):
        """Make wallet_balance readonly for all users"""
        readonly_fields = list(super().get_readonly_fields(request, obj))
        readonly_fields.append('wallet_balance')
        return readonly_fields
