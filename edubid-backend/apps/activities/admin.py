from django.contrib import admin
from .models import Activity, Submission

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'tipo', 'valor_educoins', 'valor_notas', 'fecha_entrega', 'habilitada', 'creado')
    search_fields = ('nombre', 'descripcion')
    list_filter = ('tipo', 'habilitada', 'creado')

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'activity', 'estudiante', 'contenido', 'calificacion', 'retroalimentacion', 'creado')
    search_fields = ('contenido', 'estudiante__email')
    list_filter = ('creado', 'calificacion')
