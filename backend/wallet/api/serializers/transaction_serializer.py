from rest_framework import serializers
from wallet.models import WalletTransaction

class WalletTransactionSerializer(serializers.ModelSerializer):
    appeal_id = serializers.IntegerField(source='appeal.pk', read_only=True)
    donor_name = serializers.SerializerMethodField()

    class Meta:
        model = WalletTransaction
        fields = ['id', 'amount', 'type', 'timestamp', 'appeal_id', 'donor_name', 'description', 'transfer_by']

    def get_donor_name(self, obj):
        if obj.donor:
            return getattr(obj.donor, 'get_full_name', lambda: str(obj.donor))()
        return None 