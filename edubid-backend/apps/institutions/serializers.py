from rest_framework import serializers
from .models import Institution


class InstitutionSerializer(serializers.ModelSerializer):
    """Serializer completo — administradores globales."""
    class Meta:
        model = Institution
        fields = '__all__'
        read_only_fields = ['id', 'creado', 'actualizado']


class RectorInstitutionSerializer(serializers.ModelSerializer):
    """Serializer restringido — el rector solo edita datos de personalización."""
    class Meta:
        model = Institution
        fields = [
            'id', 'nombre', 'color_primario', 'color_secundario', 'logo',
            'creado', 'actualizado',
        ]
        read_only_fields = ['id', 'creado', 'actualizado']
