from rest_framework import serializers
from .models import Classroom
from apps.groups.serializers import GroupSerializer

class ClassroomSerializer(serializers.ModelSerializer):
    grupos_clases = GroupSerializer(many=True, read_only=True)
    estudiantes_count = serializers.SerializerMethodField()
    docente_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Classroom
        fields = [
            "id",
            "nombre",
            "descripcion",
            "docente",
            "docente_nombre",
            "grupos_clases",
            "estudiantes_count",
            "creado",
        ]
        read_only_fields = ["id", "docente", "creado"]

    def get_docente_nombre(self, obj):
        """Devuelve el nombre completo del docente."""
        if obj.docente:
            return f"{obj.docente.first_name} {obj.docente.last_name}".strip()
        return None

    def get_estudiantes_count(self, obj):
        """Cuenta los estudiantes únicos en todos los grupos de la clase."""
        # Accedemos correctamente al related_name del modelo Group
        grupos = obj.grupos_clases.all()  # related_name="grupos_clases" en Group
        return (
            sum(g.estudiantes.count() for g in grupos)
            if grupos.exists()
            else 0
        )
