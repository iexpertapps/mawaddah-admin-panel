from rest_framework import serializers
from donations.models import Donation
from appeals.models import Appeal
from users.serializers.user import UserSerializer

class DonationSerializer(serializers.ModelSerializer):
    transaction_id = serializers.CharField(read_only=True)
    receipt_url = serializers.URLField(read_only=True)
    donor = UserSerializer(read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = [
            'id', 'donor', 'amount', 'currency', 'donation_type', 'note', 'appeal',
            'payment_method', 'transaction_id', 'receipt_url',
            'created_at', 'updated_at', 'status'
        ]
        read_only_fields = ['donor', 'transaction_id', 'receipt_url', 'created_at', 'updated_at']

    def get_status(self, obj):
        if obj.appeal:
            return obj.appeal.status
        return 'confirmed'

    def validate_amount(self, value):
        if value < 100:
            raise serializers.ValidationError('Minimum donation amount is 100 PKR.')
        return value

    def validate_appeal(self, value):
        if value and value.status != 'approved':
            raise serializers.ValidationError('Appeal must be approved to receive donations.')
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        validated_data['donor'] = user
        return super().create(validated_data)
