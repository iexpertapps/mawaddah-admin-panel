from rest_framework import serializers
from appeals.models import Appeal

class AppealListSerializer(serializers.ModelSerializer):
    """Serializer for appeal list views with computed fields for admin UI."""
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    beneficiary = serializers.PrimaryKeyRelatedField(read_only=True)
    approved_by = serializers.PrimaryKeyRelatedField(read_only=True)
    
    # Computed fields for admin UI
    is_donor_linked = serializers.ReadOnlyField()
    fulfillment_source = serializers.ReadOnlyField()
    user_name = serializers.SerializerMethodField()
    linked_donation_donor_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    rejected_by_name = serializers.SerializerMethodField()
    cancelled_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Appeal
        fields = [
            'id', 'title', 'description', 'category', 'amount_requested',
            'is_monthly', 'months_required', 'status', 'is_urgent',
            'created_by', 'beneficiary', 'approved_by',
            'created_at', 'updated_at', 'approved_at', 'rejected_at', 'cancelled_at',
            # New computed fields
            'is_donor_linked', 'fulfillment_source', 'user_name',
            'linked_donation_donor_name', 'approved_by_name',
            'rejected_by_name', 'cancelled_by_name'
        ]
        read_only_fields = [
            'id', 'status', 'is_urgent', 'created_by', 'beneficiary', 'approved_by', 
            'created_at', 'updated_at', 'approved_at', 'rejected_at', 'cancelled_at',
            'is_donor_linked', 'fulfillment_source',
            'user_name', 'linked_donation_donor_name', 'approved_by_name', 
            'rejected_by_name', 'cancelled_by_name'
        ]

    def get_user_name(self, instance):
        """Get beneficiary's full name."""
        if instance.beneficiary:
            return instance.beneficiary.full_name
        return None

    def get_linked_donation_donor_name(self, instance):
        """Get donor name from linked donation."""
        if instance.linked_donation and instance.linked_donation.donor:
            donor = instance.linked_donation.donor
            return donor.full_name if getattr(donor, 'full_name', None) else donor.email
        return None

    def get_approved_by_name(self, instance):
        """Get name of user who approved the appeal."""
        if instance.approved_by:
            user = instance.approved_by
            return user.full_name if getattr(user, 'full_name', None) else user.email
        return None

    def get_rejected_by_name(self, instance):
        """Get name of user who rejected the appeal."""
        if instance.rejected_by:
            user = instance.rejected_by
            return user.full_name if getattr(user, 'full_name', None) else user.email
        return None

    def get_cancelled_by_name(self, instance):
        """Get name of user who cancelled the appeal."""
        if instance.cancelled_by:
            user = instance.cancelled_by
            return user.full_name if getattr(user, 'full_name', None) else user.email
        return None

    def validate(self, data):
        is_monthly = data.get('is_monthly', False)
        months_required = data.get('months_required')
        if is_monthly:
            if not months_required or not (1 <= months_required <= 6):
                raise serializers.ValidationError({'months_required': 'Must be between 1 and 6 if is_monthly is True.'})
        
        # Validate amount_requested
        amount_requested = data.get('amount_requested')
        if amount_requested is not None:
            try:
                amount = float(amount_requested)
                if amount <= 0:
                    raise serializers.ValidationError({'amount_requested': 'Amount must be greater than zero.'})
            except (ValueError, TypeError):
                raise serializers.ValidationError({'amount_requested': 'Invalid amount format.'})
        
        return data

class AppealDetailSerializer(AppealListSerializer):
    """Serializer for appeal detail views with additional fields."""
    
    class Meta(AppealListSerializer.Meta):
        fields = AppealListSerializer.Meta.fields + [
            'rejection_reason', 'approved_at', 'fulfilled_at', 'expiry_date',
            'linked_donation', 'rejected_by', 'cancelled_by'
        ]
        read_only_fields = AppealListSerializer.Meta.read_only_fields + [
            'rejection_reason', 'approved_at', 'fulfilled_at', 'expiry_date',
            'linked_donation', 'rejected_by', 'cancelled_by'
        ]

# Keep the original serializer for backward compatibility
AppealSerializer = AppealListSerializer
