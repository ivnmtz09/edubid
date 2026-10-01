from rest_framework import serializers
from .models import Institution


def resolve_logo_url(obj, context):
    if not getattr(obj, 'logo', None):
        return None
    try:
        url = obj.logo.url
        if url.startswith('http://') or url.startswith('https://'):
            return url
        request = context.get('request') if context else None
        if request:
            return request.build_absolute_uri(url)
        return f"https://edubid.up.railway.app{url}"
    except Exception:
        return None


class FlexibleImageField(serializers.ImageField):
    """
    Permite subida de archivos binarios, omitir el campo si ya es una URL existente,
    o limpiar el logo si se envía vacío o null.
    """
    def to_internal_value(self, data):
        if data in ('', 'null', 'undefined', None):
            return None
        if isinstance(data, str):
            raise serializers.SkipField()
        return super().to_internal_value(data)


class InstitutionSerializer(serializers.ModelSerializer):
    """Serializer completo — administradores globales."""
    logo = FlexibleImageField(required=False, allow_null=True)

    class Meta:
        model = Institution
        fields = '__all__'
        read_only_fields = ['id', 'creado', 'actualizado']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['logo'] = resolve_logo_url(instance, self.context)
        return ret


class RectorInstitutionSerializer(serializers.ModelSerializer):
    """Serializer restringido — el rector solo edita datos de personalización."""
    logo = FlexibleImageField(required=False, allow_null=True)

    class Meta:
        model = Institution
        fields = [
            'id', 'nombre', 'color_primario', 'color_secundario', 'logo',
            'creado', 'actualizado',
        ]
        read_only_fields = ['id', 'creado', 'actualizado']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['logo'] = resolve_logo_url(instance, self.context)
        return ret


class PublicInstitutionSerializer(serializers.ModelSerializer):
    """Serializer público — id, nombre y logo de instituciones activas."""
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Institution
        fields = ['id', 'nombre', 'logo']

    def get_logo(self, obj):
        return resolve_logo_url(obj, self.context)
