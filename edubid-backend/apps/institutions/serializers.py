from rest_framework import serializers
from .models import Institution


def resolve_logo_url(obj, context):
    if not getattr(obj, 'logo', None):
        return None
    try:
        url = obj.logo.url
        request = context.get('request') if context else None
        if request:
            return request.build_absolute_uri(url)
        if url.startswith('http://') or url.startswith('https://'):
            return url
        return f"https://edubid.up.railway.app{url}"
    except Exception:
        return None


class InstitutionSerializer(serializers.ModelSerializer):
    """Serializer completo — administradores globales."""
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Institution
        fields = '__all__'
        read_only_fields = ['id', 'creado', 'actualizado']

    def get_logo(self, obj):
        return resolve_logo_url(obj, self.context)


class RectorInstitutionSerializer(serializers.ModelSerializer):
    """Serializer restringido — el rector solo edita datos de personalización."""
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Institution
        fields = [
            'id', 'nombre', 'color_primario', 'color_secundario', 'logo',
            'creado', 'actualizado',
        ]
        read_only_fields = ['id', 'creado', 'actualizado']

    def get_logo(self, obj):
        return resolve_logo_url(obj, self.context)


class PublicInstitutionSerializer(serializers.ModelSerializer):
    """Serializer público — id, nombre y logo de instituciones activas."""
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Institution
        fields = ['id', 'nombre', 'logo']

    def get_logo(self, obj):
        return resolve_logo_url(obj, self.context)
