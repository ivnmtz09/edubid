from rest_framework import serializers
from django.utils import timezone
from .models import Activity, Submission
from apps.users.serializers import UserProfileSerializer

class ActivitySerializer(serializers.ModelSerializer):
    classroom = serializers.SerializerMethodField()
    submissions = serializers.SerializerMethodField()
    user_submission = serializers.SerializerMethodField()
    puede_entregar = serializers.SerializerMethodField()
    esta_vencida = serializers.SerializerMethodField()
    tiempo_restante = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = '__all__'

    def get_classroom(self, obj):
        return obj.group.classroom.id if obj.group and obj.group.classroom else None
    
    def get_submissions(self, obj):
        # Solo retornar submissions si el usuario es docente
        request = self.context.get('request')
        if request and request.user.role == 'docente':
            submissions = obj.submissions.select_related('estudiante').all()
            return SubmissionListSerializer(submissions, many=True, context=self.context).data
        return []
    
    def get_user_submission(self, obj):
        """Retornar la submission del usuario actual con calificación si existe"""
        request = self.context.get('request')
        if request and request.user.role == 'estudiante':
            try:
                submission = obj.submissions.get(estudiante=request.user)
                # Incluir todos los datos de la submission incluyendo calificación
                return {
                    'id': submission.id,
                    'contenido': submission.contenido,
                    'archivo': submission.archivo.url if submission.archivo else None,
                    'calificacion': float(submission.calificacion) if submission.calificacion is not None else None,
                    'retroalimentacion': submission.retroalimentacion,
                    'creado': submission.creado.isoformat() if submission.creado else None,
                    'actualizado': submission.actualizado.isoformat() if submission.actualizado else None,
                    'estudiante': submission.estudiante.id,
                    'activity': submission.activity.id
                }
            except Submission.DoesNotExist:
                return None
        return None
    
    def get_puede_entregar(self, obj):
        """Indica si un estudiante puede entregar esta actividad"""
        return obj.puede_entregar()
    
    def get_esta_vencida(self, obj):
        """Indica si la actividad ya venció"""
        return obj.esta_vencida()
    
    def get_tiempo_restante(self, obj):
        """Devuelve el tiempo restante hasta la fecha límite"""
        if obj.esta_vencida():
            return "Vencida"
        
        diferencia = obj.fecha_entrega - timezone.now()
        dias = diferencia.days
        horas = diferencia.seconds // 3600
        minutos = (diferencia.seconds % 3600) // 60
        
        if dias > 0:
            return f"{dias} día(s) {horas} hora(s)"
        elif horas > 0:
            return f"{horas} hora(s) {minutos} minuto(s)"
        else:
            return f"{minutos} minuto(s)"

class SubmissionListSerializer(serializers.ModelSerializer):
    """Serializer para listar submissions con datos completos del estudiante"""
    estudiante = serializers.SerializerMethodField()
    estudiante_nombre = serializers.SerializerMethodField()
    estudiante_email = serializers.EmailField(source='estudiante.email', read_only=True)
    activity_nombre = serializers.CharField(source='activity.nombre', read_only=True)
    
    class Meta:
        model = Submission
        fields = [
            'id',
            'activity',
            'activity_nombre',
            'estudiante',
            'estudiante_nombre',
            'estudiante_email',
            'contenido',
            'archivo',
            'calificacion',
            'retroalimentacion',
            'creado',
            'actualizado'
        ]
    
    def get_estudiante(self, obj):
        """Retorna el objeto completo del estudiante"""
        if obj.estudiante:
            return {
                'id': obj.estudiante.id,
                'email': obj.estudiante.email,
                'first_name': obj.estudiante.first_name,
                'last_name': obj.estudiante.last_name,
            }
        return None
    
    def get_estudiante_nombre(self, obj):
        """Retorna el nombre completo del estudiante"""
        if obj.estudiante:
            return f"{obj.estudiante.first_name} {obj.estudiante.last_name}".strip()
        return "Desconocido"


class SubmissionSerializer(serializers.ModelSerializer):
    """Serializer para crear submissions"""
    estudiante = serializers.PrimaryKeyRelatedField(read_only=True)
    activity = serializers.PrimaryKeyRelatedField(queryset=Activity.objects.all())

    class Meta:
        model = Submission
        fields = [
            'id',
            'activity',
            'estudiante',
            'contenido',
            'archivo',
            'calificacion',
            'retroalimentacion',
            'creado',
            'actualizado'
        ]
        read_only_fields = ['id', 'calificacion', 'retroalimentacion', 'creado', 'actualizado']

    def validate(self, data):
        user = self.context['request'].user
        activity = data.get('activity')

        # Validar duplicado
        if Submission.objects.filter(activity=activity, estudiante=user).exists():
            raise serializers.ValidationError({
                "detail": "Ya has enviado una entrega para esta actividad."
            })

        # Validar que la actividad esté habilitada
        if not activity.habilitada:
            raise serializers.ValidationError({
                "detail": "La actividad no está habilitada para entregas."
            })

        # Verificar fecha y hora límite
        if activity.esta_vencida():
            raise serializers.ValidationError({
                "detail": "La fecha y hora límite de esta actividad han expirado.",
                "fecha_limite": activity.fecha_entrega.isoformat()
            })

        return data


class SubmissionDetailSerializer(SubmissionListSerializer):
    """Serializer para detalle de submission con toda la info"""
    activity = ActivitySerializer(read_only=True)

    class Meta(SubmissionListSerializer.Meta):
        fields = SubmissionListSerializer.Meta.fields + ['activity']