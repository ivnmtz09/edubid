from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer para notificaciones - usando los nombres en español del modelo
    """
    tiempo_transcurrido = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'tipo',
            'titulo',
            'mensaje',
            'leida',
            'activity_id',
            'grade_id', 
            'auction_id',
            'metadata',
            'creado',
            'tiempo_transcurrido'
        ]
        read_only_fields = ['id', 'creado']
    
    def get_tiempo_transcurrido(self, obj):
        """
        Retorna el tiempo transcurrido desde la creación en formato legible
        """
        try:
            from django.utils.timesince import timesince
            from django.utils import timezone
            
            # Asegurar que obj.creado es timezone-aware
            if obj.creado:
                now = timezone.now()
                tiempo = timesince(obj.creado, now)
                return f"hace {tiempo}"
            return None
        except Exception as e:
            print(f"Error en get_tiempo_transcurrido: {e}")
            return None


class NotificationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear notificaciones (docentes a estudiantes)
    """
    class Meta:
        model = Notification
        fields = [
            'usuario',
            'tipo', 
            'titulo',
            'mensaje',
            'activity_id',
            'grade_id',
            'auction_id',
            'metadata'
        ]