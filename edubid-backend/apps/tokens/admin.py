from django.contrib import admin
from .models import Period, Wallet, CoinTransaction

@admin.register(Period)
class PeriodAdmin(admin.ModelAdmin):
    list_display = ("nombre", "activo", "creado")


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("usuario", "grupo", "periodo", "saldo", "bloqueado")


@admin.register(CoinTransaction)
class CoinTransactionAdmin(admin.ModelAdmin):
    list_display = ("wallet", "tipo", "cantidad", "descripcion", "creado")
    list_filter = ("tipo",)
