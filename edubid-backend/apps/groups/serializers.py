from rest_framework import serializers
from .models import Group
from apps.classrooms.models import Classroom
from apps.users.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'username']

class GroupSerializer(serializers.ModelSerializer):
    classroom_detail = serializers.SerializerMethodField()
    classroom_nombre = serializers.CharField(source='classroom.nombre', read_only=True)
    estudiantes_count = serializers.SerializerMethodField()
    estudiantes_detail = serializers.SerializerMethodField()  # Nuevo campo

    class Meta:
        model = Group
        fields = [
            'id', 'nombre', 'descripcion', 'classroom', 'classroom_detail',
            'classroom_nombre', 'estudiantes', 'estudiantes_detail', 'codigo', 'activo',
            'codigo_generado_en', 'codigo_expira_en', 'creado', 'estudiantes_count'
        ]
        read_only_fields = ['id', 'codigo', 'codigo_generado_en', 'codigo_expira_en', 'creado']

    def get_classroom_detail(self, obj):
        if obj.classroom:
            return {
                'id': obj.classroom.id,
                'nombre': obj.classroom.nombre,
                'descripcion': obj.classroom.descripcion
            }
        return None

    def get_estudiantes_count(self, obj):
        return obj.estudiantes.count()

    def get_estudiantes_detail(self, obj):
        # Obtener los objetos completos de estudiantes
        estudiantes = obj.estudiantes.all()
        return UserSerializer(estudiantes, many=True).data

    def validate_classroom(self, value):
        request = self.context.get('request')
        if request and request.user.role == 'docente':
            if value.docente != request.user:
                raise serializers.ValidationError("No puedes crear grupos en clases que no son tuyas.")
        return value

class GroupJoinSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=20)

    def validate_code(self, value):
        if not Group.objects.filter(codigo=value, activo=True).exists():
            raise serializers.ValidationError("Codigo invalido o expirado.")
        return value