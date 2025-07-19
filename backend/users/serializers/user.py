from rest_framework import serializers
from users.models import User
from django.core.exceptions import ValidationError
from django.core.files.images import get_image_dimensions


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model with safe lookups for all fields.
    Uses SerializerMethodField for every field to ensure resilience to missing/null data.
    """
    id = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    is_verified_syed = serializers.SerializerMethodField()
    country = serializers.SerializerMethodField()
    state = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    wallet_balance = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'first_name', 'last_name', 'phone', 'role',
            'is_verified_syed', 'country', 'state', 'city',
            'wallet_balance', 'created_at', 'updated_at'
        ]
        read_only_fields = ['wallet_balance', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def get_id(self, obj):
        return getattr(obj, 'id', None)

    def get_email(self, obj):
        return getattr(obj, 'email', '') or ''

    def get_name(self, obj):
        first_name = getattr(obj, 'first_name', '') or ''
        last_name = getattr(obj, 'last_name', '') or ''
        full_name = f"{first_name} {last_name}".strip()
        return full_name or getattr(obj, 'email', '')

    def get_first_name(self, obj):
        return getattr(obj, 'first_name', '') or ''

    def get_last_name(self, obj):
        return getattr(obj, 'last_name', '') or ''

    def get_phone(self, obj):
        return getattr(obj, 'phone', '') or ''

    def get_role(self, obj):
        # If you ever add a profile relation, use: getattr(getattr(obj, 'profile', None), 'role', None)
        return getattr(obj, 'role', None)

    def get_is_verified_syed(self, obj):
        return getattr(obj, 'is_verified_syed', False)

    def get_country(self, obj):
        return getattr(obj, 'country', '') or ''

    def get_state(self, obj):
        return getattr(obj, 'state', '') or ''

    def get_city(self, obj):
        return getattr(obj, 'city', '') or ''

    def get_wallet_balance(self, obj):
        return str(getattr(obj, 'wallet_balance', '0.00'))

    def get_created_at(self, obj):
        val = getattr(obj, 'created_at', None)
        return val.isoformat() if val else None

    def get_updated_at(self, obj):
        val = getattr(obj, 'updated_at', None)
        return val.isoformat() if val else None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Always return roles as an array
        data['roles'] = [data['role']] if data['role'] else []
        return data

    @staticmethod
    def create_user(validated_data):
        """
        Helper to create a user with hashed password if needed (not used in ViewSet for now).
        """
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users with password.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone',
            'role', 'is_verified_syed', 'country', 'state', 'city',
            'withdraw_method', 'account_title', 'account_number', 'bank_name',
            'password', 'password_confirm'
        ]
    
    def validate(self, data):
        """
        Validate password confirmation and business rules.
        """
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        
        # Apply same business rules as UserSerializer
        if data.get('role') == 'recipient' and not data.get('is_verified_syed', False):
            raise serializers.ValidationError({
                'is_verified_syed': 'Recipients must be verified Sadaat.'
            })
        
        withdraw_method = data.get('withdraw_method')
        if withdraw_method:
            if not data.get('account_title'):
                raise serializers.ValidationError({
                    'account_title': 'Account title is required when withdrawal method is specified.'
                })
            if not data.get('account_number'):
                raise serializers.ValidationError({
                    'account_number': 'Account number is required when withdrawal method is specified.'
                })
            
            if withdraw_method == 'bank' and not data.get('bank_name'):
                raise serializers.ValidationError({
                    'bank_name': 'Bank name is required when withdrawal method is bank.'
                })
        
        return data
    
    def create(self, validated_data):
        """
        Create user with hashed password.
        """
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating users (excludes wallet_balance).
    """
    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name', 'phone',
            'role', 'is_verified_syed', 'country', 'state', 'city',
            'withdraw_method', 'account_title', 'account_number', 'bank_name',
            'is_active'
        ]
    
    def validate(self, data):
        """
        Apply business rules for updates.
        """
        # Get current instance data for validation
        instance = self.instance
        
        # Rule 1: If role is recipient, is_verified_syed must be True
        role = data.get('role', instance.role if instance else 'user')
        is_verified_syed = data.get('is_verified_syed', instance.is_verified_syed if instance else False)
        
        if role == 'recipient' and not is_verified_syed:
            raise serializers.ValidationError({
                'is_verified_syed': 'Recipients must be verified Sadaat.'
            })
        
        # Rule 2: If withdraw_method is set, validate related fields
        withdraw_method = data.get('withdraw_method', instance.withdraw_method if instance else None)
        if withdraw_method:
            account_title = data.get('account_title', instance.account_title if instance else None)
            account_number = data.get('account_number', instance.account_number if instance else None)
            bank_name = data.get('bank_name', instance.bank_name if instance else None)
            
            if not account_title:
                raise serializers.ValidationError({
                    'account_title': 'Account title is required when withdrawal method is specified.'
                })
            if not account_number:
                raise serializers.ValidationError({
                    'account_number': 'Account number is required when withdrawal method is specified.'
                })
            
            if withdraw_method == 'bank' and not bank_name:
                raise serializers.ValidationError({
                    'bank_name': 'Bank name is required when withdrawal method is bank.'
                })
        
        return data 


class AdminProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(read_only=True)
    full_name = serializers.SerializerMethodField()
    phone_number = serializers.CharField(source='phone', required=True)
    avatar = serializers.ImageField(allow_null=True, required=False)
    language = serializers.ChoiceField(choices=User.LANGUAGE_CHOICES, required=True)
    last_login = serializers.DateTimeField(read_only=True)
    role = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'full_name', 'email', 'phone_number', 'avatar', 'language', 'last_login', 'role'
        ]

    def get_full_name(self, obj):
        first_name = getattr(obj, 'first_name', '') or ''
        last_name = getattr(obj, 'last_name', '') or ''
        full_name = f"{first_name} {last_name}".strip()
        return full_name or getattr(obj, 'email', '')

    def validate_phone(self, value):
        user = self.instance
        if user and User.objects.exclude(pk=user.pk).filter(phone=value).exists():
            raise serializers.ValidationError('Phone number must be unique.')
        return value

    def validate_avatar(self, value):
        if value is None:
            return value
        if value.size > 2 * 1024 * 1024:
            raise serializers.ValidationError('Avatar file size must be ≤ 2MB.')
        if not value.content_type.startswith('image/'):
            raise serializers.ValidationError('Avatar must be an image file.')
        return value

    def update(self, instance, validated_data):
        # Handle full_name split
        full_name = None
        if hasattr(self, 'initial_data') and isinstance(self.initial_data, dict):
            full_name = self.initial_data.get('full_name')
        if full_name:
            parts = full_name.strip().split(' ', 1)
            instance.first_name = parts[0]
            instance.last_name = parts[1] if len(parts) > 1 else ''
        # Handle phone
        phone = validated_data.pop('phone', None)
        if phone:
            instance.phone = phone
        # Handle language
        language = validated_data.pop('language', None)
        if language:
            instance.language = language
        # Handle avatar
        avatar = validated_data.pop('avatar', None)
        if avatar is not None:
            if avatar == '':  # Clear avatar
                instance.avatar.delete(save=False)
                instance.avatar = None
            else:
                instance.avatar = avatar
        instance.save()
        return instance 