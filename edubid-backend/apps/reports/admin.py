from django.contrib import admin
from .models import UserReport


@admin.register(UserReport)
class UserReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'asunto', 'tipo', 'user', 'email_contacto', 'estado', 'creado')
    list_filter = ('tipo', 'estado', 'creado')
    search_fields = ('asunto', 'descripcion', 'email_contacto', 'nombre_contacto', 'user__email')
    readonly_fields = ('creado',)
