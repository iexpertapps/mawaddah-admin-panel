from rest_framework import serializers

class PlatformOverviewSerializer(serializers.Serializer):
    total_withdrawn_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_current_balance = serializers.DecimalField(max_digits=12, decimal_places=2)

class RecipientWalletStatsSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.EmailField()
    total_received = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_withdrawn = serializers.DecimalField(max_digits=12, decimal_places=2)
    current_balance = serializers.DecimalField(max_digits=12, decimal_places=2)

class WithdrawalHistorySerializer(serializers.Serializer):
    date = serializers.DateField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)

class TransferHistorySerializer(serializers.Serializer):
    date = serializers.DateField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    transferred_by = serializers.CharField()

class AdminWalletTransactionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    user_name = serializers.CharField()
    user_email = serializers.EmailField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    type = serializers.CharField()
    description = serializers.CharField(allow_blank=True, required=False)
    timestamp = serializers.DateTimeField()
    user_role = serializers.CharField()
    user_id = serializers.IntegerField()
    transfer_by = serializers.CharField()
    # Appeal info
    appeal_id = serializers.IntegerField(required=False, allow_null=True)
    appeal_title = serializers.CharField(required=False, allow_blank=True)
    appeal_status = serializers.CharField(required=False, allow_blank=True)
    appeal_amount_requested = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True) 