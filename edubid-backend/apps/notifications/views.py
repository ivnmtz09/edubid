from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone

from .models import Notification
from .serializers import NotificationSerializer, NotificationCreateSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar notificaciones.
    - Los usuarios solo ven sus propias notificaciones.
    - Los docentes pueden enviar notificaciones a sus estudiantes.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(usuario=user).select_related('usuario')

    def get_serializer_class(self):
        """
        Usar diferente serializer para crear notificaciones
        """
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer

    @action(detail=False, methods=['get'], url_path='no-leidas')
    def no_leidas(self, request):
        """Obtener solo las notificaciones no leídas"""
        notificaciones = self.get_queryset().filter(leida=False)
        serializer = self.get_serializer(notificaciones, many=True)
        return Response({
            'total': notificaciones.count(),
            'notificaciones': serializer.data
        })

    @action(detail=False, methods=['post'], url_path='marcar-todas-leidas')
    def marcar_todas_leidas(self, request):
        """Marcar todas las notificaciones del usuario como leídas"""
        count = self.get_queryset().filter(leida=False).update(leida=True)
        return Response({
            'message': f'{count} notificaciones marcadas como leídas'
        })

    @action(detail=True, methods=['post'], url_path='marcar-leida')
    def marcar_leida(self, request, pk=None):
        """Marcar una notificación específica como leída"""
        notificacion = self.get_object()
        notificacion.marcar_como_leida()
        return Response({
            'message': 'Notificación marcada como leída',
            'notificacion': self.get_serializer(notificacion).data
        })

    @action(detail=False, methods=['delete'], url_path='eliminar-todas')
    def eliminar_todas(self, request):
        """Eliminar todas las notificaciones del usuario"""
        count, _ = self.get_queryset().delete()
        return Response({
            'message': f'{count} notificaciones eliminadas'
        })

    @action(detail=False, methods=['get'], url_path='estadisticas')
    def estadisticas(self, request):
        """Obtener estadísticas de notificaciones"""
        qs = self.get_queryset()
        total = qs.count()
        no_leidas = qs.filter(leida=False).count()
        leidas = qs.filter(leida=True).count()

        por_tipo = {}
        for tipo, label in Notification.TIPO_CHOICES:
            por_tipo[tipo] = qs.filter(tipo=tipo).count()

        return Response({
            'total': total,
            'no_leidas': no_leidas,
            'leidas': leidas,
            'por_tipo': por_tipo
        })

    @action(detail=False, methods=['post'], url_path='enviar-estudiantes')
    def enviar_a_estudiantes(self, request):
        """
        Permite a docentes enviar notificaciones a sus estudiantes
        """
        from apps.classrooms.models import Classroom
        
        user = request.user
        
        # Verificar que sea docente
        if user.role != 'docente':
            return Response({
                'error': 'Solo los docentes pueden enviar notificaciones a estudiantes'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener estudiantes del docente
        classrooms = Classroom.objects.filter(docente=user)
        estudiantes = []
        for classroom in classrooms:
            estudiantes.extend(classroom.estudiantes.all())
        
        if not estudiantes:
            return Response({
                'error': 'No tienes estudiantes asignados'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear notificaciones para cada estudiante
        titulo = request.data.get('titulo')
        mensaje = request.data.get('mensaje')
        tipo = request.data.get('tipo', 'anuncio')
        
        if not titulo or not mensaje:
            return Response({
                'error': 'Título y mensaje son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        notificaciones = [
            Notification(
                usuario=estudiante,
                tipo=tipo,
                titulo=titulo,
                mensaje=mensaje,
                metadata={
                    'enviado_por': f'{user.first_name} {user.last_name}',
                    'docente_email': user.email
                }
            )
            for estudiante in estudiantes
        ]
        
        Notification.objects.bulk_create(notificaciones)
        
        return Response({
            'message': f'Notificación enviada a {len(estudiantes)} estudiantes'
        })