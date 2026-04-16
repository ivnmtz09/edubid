from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'usuario', 'tipo', 'titulo', 'leida', 'creado']
    list_filter = ['tipo', 'leida', 'creado']
    search_fields = ['usuario__email', 'titulo', 'mensaje']
    readonly_fields = ['creado', 'actualizado']
    list_per_page = 50

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('usuario')