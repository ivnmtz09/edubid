from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Classroom
from .serializers import ClassroomSerializer
from apps.users.models import User
from apps.users.permissions import IsDocente

class ClassroomViewSet(viewsets.ModelViewSet):
    serializer_class = ClassroomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'docente':
            return Classroom.objects.filter(docente=user)
        elif user.role == 'estudiante':
            # Estudiantes ven clases de los grupos a los que pertenecen
            return Classroom.objects.filter(grupos_clases__estudiantes=user).distinct()
        return Classroom.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsDocente]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(docente=self.request.user)

    @action(detail=True, methods=['get'], permission_classes=[IsDocente])
    def students(self, request, pk=None):
        """Obtener estudiantes de una clase (solo para docentes)"""
        classroom = self.get_object()
        
        # Verificar que el docente es dueño de la clase
        if classroom.docente != request.user:
            raise PermissionDenied("No tienes permiso para ver los estudiantes de esta clase.")
        
        # CORREGIDO: Usar la relación correcta
        estudiantes = User.objects.filter(
            grupos_estudiante__classroom=classroom,  # Relación corregida
            role="estudiante"
        ).distinct()
        
        from apps.users.serializers import UserProfileSerializer
        serializer = UserProfileSerializer(estudiantes, many=True)
        return Response(serializer.data)