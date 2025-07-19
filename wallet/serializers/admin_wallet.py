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