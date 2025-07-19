from rest_framework import serializers
from wallet.models import Wallet

class WalletSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.pk', read_only=True)

    class Meta:
        model = Wallet
        fields = ['user_id', 'balance'] 