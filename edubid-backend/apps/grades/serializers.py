from rest_framework import serializers
from .models import Grade


class GradeSerializer(serializers.ModelSerializer):
    student_email = serializers.EmailField(source="student.email", read_only=True)
    student_name = serializers.SerializerMethodField()
    activity_nombre = serializers.CharField(source="activity.nombre", read_only=True)
    coins_ganados = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = [
            "id", "activity", "activity_nombre", "student", "student_email",
            "student_name", "nota", "retroalimentacion", "coins_ganados", "creado"
        ]
        read_only_fields = ["creado", "coins_ganados"]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def get_coins_ganados(self, obj):
        return obj.calcular_coins_ganados()


class GradeCreateSerializer(serializers.ModelSerializer):
    """Serializer específico para crear calificaciones"""
    
    class Meta:
        model = Grade
        fields = ["activity", "student", "nota", "retroalimentacion"]

    def validate_nota(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("La nota debe estar entre 0 y 100.")
        return value

    def validate(self, data):
        # Verificar que el estudiante pertenezca al grupo de la actividad
        activity = data.get('activity')
        student = data.get('student')
        
        if activity and student:
            if not activity.group.estudiantes.filter(id=student.id).exists():
                raise serializers.ValidationError(
                    "El estudiante no pertenece al grupo de esta actividad."
                )
        
        return data