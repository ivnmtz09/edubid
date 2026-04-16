from django.contrib import admin
from .models import Auction, Bid
from django.contrib.admin import DateFieldListFilter

@admin.register(Auction)
class AuctionAdmin(admin.ModelAdmin):
    list_display = ('id', 'titulo', 'creador', 'estado', 'creado', 'fecha_fin')
    search_fields = ('titulo', 'descripcion')
    list_filter = (
        'estado',
        ('creado', DateFieldListFilter),
    )

@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display = ('id', 'auction', 'estudiante', 'cantidad', 'creado')
    list_filter = (('creado', DateFieldListFilter),)
