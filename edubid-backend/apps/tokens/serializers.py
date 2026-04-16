from rest_framework import serializers
from .models import Period, Wallet, CoinTransaction


class PeriodSerializer(serializers.ModelSerializer):
    grupo_nombre = serializers.CharField(source="grupo.nombre", read_only=True)
    
    class Meta:
        model = Period
        fields = [
            "id", "grupo", "grupo_nombre", "nombre", "descripcion",
            "fecha_inicio", "fecha_fin", "activo", "creado"
        ]
        read_only_fields = ["creado"]


class CoinTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinTransaction
        fields = [
            "id", "wallet", "tipo", "cantidad", "descripcion", "creado"
        ]
        read_only_fields = ["wallet", "tipo", "creado"]


class WalletSerializer(serializers.ModelSerializer):
    transacciones = CoinTransactionSerializer(many=True, read_only=True)
    usuario_email = serializers.EmailField(source="usuario.email", read_only=True)
    grupo_nombre = serializers.CharField(source="grupo.nombre", read_only=True)
    periodo_nombre = serializers.CharField(source="periodo.nombre", read_only=True)
    saldo_disponible = serializers.SerializerMethodField()

    class Meta:
        model = Wallet
        fields = [
            "id", "usuario", "usuario_email", "grupo", "grupo_nombre",
            "periodo", "periodo_nombre", "saldo", "bloqueado", 
            "saldo_disponible", "transacciones"
        ]
        read_only_fields = ["usuario"]

    def get_saldo_disponible(self, obj):
        return obj.saldo - obj.bloqueado