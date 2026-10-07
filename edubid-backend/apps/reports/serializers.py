from rest_framework import serializers
from .models import UserReport


class UserReportSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = UserReport
        fields = [
            'id',
            'user',
            'email_contacto',
            'nombre_contacto',
            'tipo',
            'tipo_display',
            'asunto',
            'descripcion',
            'pagina_origen',
            'navegador_info',
            'estado',
            'estado_display',
            'creado',
        ]
        read_only_fields = ['id', 'user', 'estado', 'creado', 'tipo_display', 'estado_display']
