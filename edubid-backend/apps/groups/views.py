from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
from django.db import transaction
from .models import Group
from .serializers import GroupSerializer, GroupJoinSerializer
from apps.tokens.models import Wallet, Period
from apps.users.permissions import IsDocente

class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_qs = Group.objects.select_related(
            'classroom', 'classroom__docente', 'classroom__docente__institucion'
        ).prefetch_related('estudiantes')
        if user.role == 'admin':
            return base_qs.all()
        elif user.role in ['rector', 'coordinador']:
            if user.institucion_id:
                return base_qs.filter(classroom__docente__institucion_id=user.institucion_id)
            return Group.objects.none()
        elif user.role == 'docente':
            return base_qs.filter(classroom__docente=user)
        elif user.role == 'estudiante':
            return base_qs.filter(estudiantes=user)
        return Group.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsDocente]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        classroom = serializer.validated_data.get('classroom')
        if classroom.docente != self.request.user:
            raise PermissionDenied("No puedes crear grupos en clases que no son tuyas.")
        serializer.save()

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request):
        """Unirse a un grupo por codigo"""
        serializer = GroupJoinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        code = serializer.validated_data['code']
        user = request.user
        
        if user.role != 'estudiante':
            return Response(
                {"detail": "Solo los estudiantes pueden unirse a grupos."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            group = Group.objects.select_related('classroom__docente__institucion').get(codigo=code, activo=True)
        except Group.DoesNotExist:
            return Response(
                {"detail": "Codigo invalido o expirado."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if group.codigo_expira_en and group.codigo_expira_en < timezone.now():
            return Response(
                {"detail": "El código de vinculación ha expirado. Solicita un nuevo código a tu docente."},
                status=status.HTTP_400_BAD_REQUEST
            )

        docente_institucion_id = getattr(getattr(group.classroom.docente, 'institucion', None), 'id', None)
        if user.institucion_id and docente_institucion_id and user.institucion_id != docente_institucion_id:
            return Response(
                {"detail": "No puedes unirte a un grupo de una institución educativa diferente a la tuya."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if group.estudiantes.filter(id=user.id).exists():
            return Response(
                {"detail": "Ya estas en este grupo."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            if not user.institucion_id and docente_institucion_id:
                user.institucion_id = docente_institucion_id
                user.save(update_fields=['institucion'])

            # CREAR WALLET AL UNIRSE AL GRUPO
            periodo_activo = Period.objects.filter(grupo=group, activo=True).first()
            if not periodo_activo:
                periodo_activo = Period.objects.filter(grupo=group).order_by('-fecha_fin').first()
            wallet_creada = False
            
            if periodo_activo:
                wallet, created = Wallet.objects.get_or_create(
                    usuario=user,
                    grupo=group,
                    periodo=periodo_activo,
                    defaults={'saldo_educoins': 0, 'bloqueado_educoins': 0}
                )
                wallet_creada = created
            
            group.estudiantes.add(user)
        
        serializer = self.get_serializer(group)
        return Response({
            "detail": "Te has unido al grupo correctamente.",
            "mensaje": "Te has unido al grupo correctamente.",
            "grupo": serializer.data,
            "wallet_creada": wallet_creada,
            "periodo_activo": periodo_activo.nombre if periodo_activo else None
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join_by_id(self, request, pk=None):
        """Unirse a un grupo por ID"""
        group = self.get_object()
        user = request.user
        
        if user.role != 'estudiante':
            return Response(
                {"detail": "Solo los estudiantes pueden unirse a grupos."},
                status=status.HTTP_403_FORBIDDEN
            )

        docente_institucion_id = getattr(getattr(group.classroom.docente, 'institucion', None), 'id', None)
        if user.institucion_id and docente_institucion_id and user.institucion_id != docente_institucion_id:
            return Response(
                {"detail": "No puedes unirte a un grupo de una institución educativa diferente a la tuya."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if group.estudiantes.filter(id=user.id).exists():
            return Response(
                {"detail": "Ya estás en este grupo."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            if not user.institucion_id and docente_institucion_id:
                user.institucion_id = docente_institucion_id
                user.save(update_fields=['institucion'])

            # CREAR WALLET AL UNIRSE AL GRUPO
            periodo_activo = Period.objects.filter(grupo=group, activo=True).first()
            if not periodo_activo:
                periodo_activo = Period.objects.filter(grupo=group).order_by('-fecha_fin').first()
            wallet_creada = False
            
            if periodo_activo:
                wallet, created = Wallet.objects.get_or_create(
                    usuario=user,
                    grupo=group,
                    periodo=periodo_activo,
                    defaults={'saldo_educoins': 0, 'bloqueado_educoins': 0}
                )
                wallet_creada = created
            
            group.estudiantes.add(user)
        
        serializer = self.get_serializer(group)
        return Response({
            "detail": "Te has unido correctamente al grupo.",
            "mensaje": "Te has unido correctamente al grupo.",
            "grupo": serializer.data,
            "wallet_creada": wallet_creada,
            "periodo_activo": periodo_activo.nombre if periodo_activo else None
        })

    @action(detail=True, methods=['get'])
    def estudiantes(self, request, pk=None):
        """Obtener lista de estudiantes del grupo"""
        group = self.get_object()
        estudiantes = group.estudiantes.all()
        
        # Serializar los datos de estudiantes
        estudiantes_data = []
        for estudiante in estudiantes:
            estudiantes_data.append({
                'id': estudiante.id,
                'first_name': estudiante.first_name,
                'last_name': estudiante.last_name,
                'email': estudiante.email,
                'nombre': estudiante.first_name,  # Para compatibilidad
                'apellido': estudiante.last_name,  # Para compatibilidad
                'correo': estudiante.email,  # Para compatibilidad
            })
        
        return Response(estudiantes_data)