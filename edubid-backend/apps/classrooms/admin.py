from django.contrib import admin
from .models import Classroom
from apps.groups.models import Group

class GroupInline(admin.TabularInline):
    model = Group
    extra = 1
    show_change_link = True
    fields = ('nombre', 'descripcion')  # sólo nombre y descripción del grupo aquí
    # No se pueden editar los estudiantes desde este inline, pero puedes entrar al group y editarlos ahí.

@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'docente', 'creado')
    list_filter = ('docente',)
    search_fields = ('nombre', 'descripcion')
    ordering = ('-creado',)
    inlines = [GroupInline]
