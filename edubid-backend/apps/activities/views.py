from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from apps.grades.models import Grade
from apps.tokens.models import Wallet, Period
from .models import Activity, Submission
from .serializers import (
    ActivitySerializer, 
    SubmissionSerializer, 
    SubmissionListSerializer,
    SubmissionDetailSerializer
)
from apps.users.permissions import IsDocente


class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Activity.objects.select_related('group', 'group__classroom')
        
        if user.role == 'docente':
            queryset = queryset.filter(group__classroom__docente=user)
        elif user.role == 'estudiante':
            queryset = queryset.filter(group__estudiantes=user, habilitada=True)
        else:
            return Activity.objects.none()
        
        queryset = queryset.prefetch_related('submissions__estudiante')
        return queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsDocente]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        group = serializer.validated_data.get('group')
        if group.classroom.docente != self.request.user:
            raise PermissionDenied("No puedes crear actividades en grupos que no te pertenecen.")
        serializer.save()


class SubmissionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return SubmissionListSerializer
        elif self.action == 'retrieve':
            return SubmissionDetailSerializer
        return SubmissionSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Submission.objects.select_related(
            'activity', 
            'estudiante',
            'activity__group',
            'activity__group__classroom'
        )
        
        if user.role == 'docente':
            queryset = queryset.filter(activity__group__classroom__docente=user)
        elif user.role == 'estudiante':
            queryset = queryset.filter(estudiante=user)
        
        activity_id = self.request.query_params.get('activity')
        if activity_id:
            queryset = queryset.filter(activity_id=activity_id)
        
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != "estudiante":
            raise PermissionDenied("Solo los estudiantes pueden enviar actividades.")
        serializer.save(estudiante=user)

    def destroy(self, request, *args, **kwargs):
        """Permitir que estudiantes cancelen sus entregas si NO están calificadas"""
        submission = self.get_object()
        
        # Solo el estudiante dueño puede eliminar
        if request.user.role == 'estudiante' and submission.estudiante != request.user:
            raise PermissionDenied("No puedes eliminar entregas de otros estudiantes.")
        
        # No se puede eliminar si ya está calificada
        if submission.calificacion is not None:
            return Response(
                {"detail": "No puedes cancelar una entrega que ya fue calificada."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar que la actividad no haya vencido
        if submission.activity.esta_vencida():
            return Response(
                {"detail": "No puedes cancelar una entrega después de la fecha límite."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        submission.delete()
        return Response(
            {"detail": "Entrega cancelada exitosamente."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["patch"], url_path="grade")
    @transaction.atomic
    def grade_submission(self, request, pk=None):
        """Calificar una entrega y asignar Educoins a la wallet EXISTENTE"""
        submission = self.get_object()
        user = request.user

        if user.role != "docente":
            raise PermissionDenied("Solo los docentes pueden calificar entregas.")

        nota = request.data.get("nota")
        retro = request.data.get("retroalimentacion", "")

        if nota is None:
            return Response({"error": "Debes incluir una calificacion."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Actualizar submission
        submission.calificacion = nota
        submission.retroalimentacion = retro
        submission.save()

        # 2. Crear o actualizar Grade (esto activara el signal automaticamente)
        grade, created = Grade.objects.update_or_create(
            activity=submission.activity,
            student=submission.estudiante,
            defaults={"nota": nota, "retroalimentacion": retro}
        )

        # 3. Calcular coins ganados
        coins_ganados = grade.calcular_coins_ganados()
        
        # 4. Obtener wallet actualizada para la respuesta
        periodo_activo = Period.objects.filter(grupo=submission.activity.group, activo=True).first()
        wallet_saldo = 0
        
        if periodo_activo:
            try:
                wallet = Wallet.objects.get(
                    usuario=submission.estudiante,
                    grupo=submission.activity.group,
                    periodo=periodo_activo
                )
                wallet_saldo = wallet.saldo
            except Wallet.DoesNotExist:
                print(f"ERROR: No se encontro wallet para {submission.estudiante.email}")

        # 5. Respuesta final
        return Response({
            "mensaje": "Entrega calificada correctamente",
            "submission_id": submission.id,
            "nota": submission.calificacion,
            "retroalimentacion": submission.retroalimentacion,
            "grade_id": grade.id,
            "coins_ganados": coins_ganados,
            "wallet_saldo": wallet_saldo
        }, status=status.HTTP_200_OK)