from django.contrib import admin
from .models import Institution


@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'codigo_dane', 'activo', 'creado')
    search_fields = ('nombre', 'codigo_dane')
    list_filter = ('activo',)
    ordering = ('-creado',)
    readonly_fields = ('creado', 'actualizado')
