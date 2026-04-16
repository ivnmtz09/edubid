from django.contrib import admin
from .models import Group

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'classroom', 'codigo', 'activo', 'creado')
    list_filter = ('classroom', 'activo')
    search_fields = ('nombre', 'codigo', 'classroom__nombre')
    filter_horizontal = ('estudiantes',)
