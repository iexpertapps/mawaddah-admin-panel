from rest_framework import serializers
from .models import Setting
from django.conf import settings as django_settings
from users.models.user import User

# Define all settings keys, types, defaults, and sensitive fields
SETTINGS_SCHEMA = {
    # General
    'platform_name': {'type': str, 'default': 'Mawaddah'},
    'default_locale': {'type': str, 'default': 'en', 'choices': ['en', 'ur']},
    'timezone': {'type': str, 'default': 'Asia/Karachi'},
    'logo_url': {'type': str, 'default': ''},
    'footer_text': {'type': str, 'default': ''},
    # Donation
    'min_monthly_donation': {'type': int, 'default': 1000},
    'default_donation_amounts': {'type': list, 'default': [500, 1000, 5000]},
    'donation_cutoff_day': {'type': int, 'default': 1},
    'auto_assign_donor_role': {'type': bool, 'default': False},
    'allow_anonymous_giving': {'type': bool, 'default': False},
    # Payment Gateways
    'stripe_public_key': {'type': str, 'default': ''},
    'stripe_secret_key': {'type': str, 'default': '', 'sensitive': True},
    'jazzcash_merchant_id': {'type': str, 'default': ''},
    'jazzcash_password': {'type': str, 'default': '', 'sensitive': True},
    'easypaisa_token': {'type': str, 'default': '', 'sensitive': True},
    'default_gateway': {'type': str, 'default': 'stripe', 'choices': ['stripe', 'jazzcash', 'easypaisa']},
    'payment_test_mode': {'type': bool, 'default': False},
    # Mobile App
    'app_required_version': {'type': str, 'default': ''},
    'announcement_banner': {'type': str, 'default': ''},
    'disable_appeals_for_new_users': {'type': bool, 'default': False},
    'default_app_language': {'type': str, 'default': 'en', 'choices': ['en', 'ur']},
    'deep_link_base_url': {'type': str, 'default': ''},
    # Verification & Security
    'otp_provider_key': {'type': str, 'default': '', 'sensitive': True},
    'otp_expiry_minutes': {'type': int, 'default': 5},
    'max_otp_attempts': {'type': int, 'default': 3},
    'enable_email_verification': {'type': bool, 'default': False},
    'enable_2fa_for_admin': {'type': bool, 'default': False},
    'allow_dev_tool_access': {'type': bool, 'default': False},
    # Notification Templates
    'reminder_days': {'type': list, 'default': [1, 4, 7]},
    'reminder_template_text': {'type': str, 'default': ''},
    'notify_shura_on_skipped_donors': {'type': bool, 'default': False},
    'email_from_name': {'type': str, 'default': ''},
    'whatsapp_template_text': {'type': str, 'default': ''},
    # Audit Logs (Phase 2)
    'enable_audit_logs': {'type': bool, 'default': False},
    'log_retention_days': {'type': int, 'default': 90},
    'notify_on_setting_change': {'type': bool, 'default': False},
}

SENSITIVE_MASK = '•••••'

class SettingSerializer(serializers.Serializer):
    def to_representation(self, instance):
        # instance: queryset of Setting
        data = {}
        settings_map = {s.key: s.value for s in instance}
        for key, meta in SETTINGS_SCHEMA.items():
            value = settings_map.get(key, meta['default'])
            if meta.get('sensitive') and value:
                data[key] = SENSITIVE_MASK
            else:
                data[key] = value
        return data

    def validate(self, attrs):
        validated = {}
        for key, value in attrs.items():
            meta = SETTINGS_SCHEMA.get(key)
            if not meta:
                continue
            if meta.get('sensitive') and (value == SENSITIVE_MASK or not value):
                continue  # Ignore masked or empty sensitive fields
            if 'choices' in meta and value not in meta['choices']:
                raise serializers.ValidationError({key: f"Invalid value. Must be one of {meta['choices']}"})
            expected_type = meta['type']
            if expected_type == list and not isinstance(value, list):
                raise serializers.ValidationError({key: "Must be a list"})
            if expected_type == int and not isinstance(value, int):
                raise serializers.ValidationError({key: "Must be an integer"})
            if expected_type == bool and not isinstance(value, bool):
                raise serializers.ValidationError({key: "Must be a boolean"})
            if expected_type == str and not isinstance(value, str):
                raise serializers.ValidationError({key: "Must be a string"})
            validated[key] = value
        return validated 