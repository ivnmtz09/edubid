from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db import transaction
from .models import Period, Wallet, CoinTransaction
from .serializers import PeriodSerializer, WalletSerializer, CoinTransactionSerializer
from apps.users.permissions import AdminOrDocente


class PeriodViewSet(viewsets.ModelViewSet):
    queryset = Period.objects.all()  # Queryset base requerido por DRF
    serializer_class = PeriodSerializer
    permission_classes = [AdminOrDocente]

    def get_queryset(self):
        """Filtrar periodos según el rol del usuario"""
        user = self.request.user
        
        # Admin ve todos los periodos
        if user.is_staff or user.role == 'admin':
            return Period.objects.all().order_by("-creado")
        
        # Docente solo ve periodos de sus grupos
        if user.role == 'docente':
            return Period.objects.filter(
                grupo__classroom__docente=user
            ).select_related('grupo', 'grupo__classroom').order_by("-creado")
        
        # Estudiantes ven periodos de sus grupos
        if user.role == 'estudiante':
            return Period.objects.filter(
                grupo__estudiantes=user
            ).select_related('grupo', 'grupo__classroom').order_by("-creado")
        
        return Period.objects.none()

    @transaction.atomic
    def perform_create(self, serializer):
        """
        Al crear un periodo:
        - Validar que el docente sea dueño del grupo
        - Crear wallets para todos los estudiantes del grupo
        """
        user = self.request.user
        grupo = serializer.validated_data.get('grupo')
        
        # Validar que el docente sea dueño del grupo
        if user.role == 'docente' and grupo.classroom.docente != user:
            raise ValidationError("No puedes crear periodos para grupos que no son tuyos.")
        
        # Guardar el periodo
        periodo = serializer.save()
        
        # Crear wallets para todos los estudiantes actuales del grupo
        estudiantes = grupo.estudiantes.all()
        wallets_creadas = 0
        
        for estudiante in estudiantes:
            wallet, created = Wallet.objects.get_or_create(
                usuario=estudiante,
                grupo=grupo,
                periodo=periodo,
                defaults={'saldo': 0, 'bloqueado': 0}
            )
            if created:
                wallets_creadas += 1
        
        # Log de cuántas wallets se crearon
        print(f"✅ Periodo '{periodo.nombre}' creado. {wallets_creadas} wallets generadas.")

    @action(detail=True, methods=['post'], permission_classes=[AdminOrDocente])
    def activar(self, request, pk=None):
        """
        Activa este periodo y desactiva todos los demás del mismo grupo.
        POST /api/coins/periods/{id}/activar/
        """
        periodo = self.get_object()
        
        # Validar que el docente sea dueño
        if request.user.role == 'docente':
            if periodo.grupo.classroom.docente != request.user:
                raise ValidationError("No tienes permiso para activar este periodo.")
        
        # Activar este periodo (automáticamente desactiva los otros del grupo)
        periodo.activar()
        
        serializer = self.get_serializer(periodo)
        return Response({
            "mensaje": f"Periodo '{periodo.nombre}' activado correctamente.",
            "periodo": serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mis_periodos(self, request):
        """
        Devuelve los periodos de los grupos a los que pertenece el usuario.
        GET /api/coins/periods/mis_periodos/
        """
        user = request.user
        
        if user.role == 'estudiante':
            periodos = Period.objects.filter(
                grupo__estudiantes=user
            ).select_related('grupo', 'grupo__classroom').order_by('-creado')
        elif user.role == 'docente':
            periodos = Period.objects.filter(
                grupo__classroom__docente=user
            ).select_related('grupo', 'grupo__classroom').order_by('-creado')
        else:
            periodos = Period.objects.all().order_by('-creado')
        
        serializer = self.get_serializer(periodos, many=True)
        return Response(serializer.data)


class WalletViewSet(viewsets.ModelViewSet):
    queryset = Wallet.objects.all().select_related("usuario", "grupo", "periodo")
    serializer_class = WalletSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "estudiante":
            return Wallet.objects.filter(usuario=user)
        return super().get_queryset()

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def mi_wallet(self, request):
        """Endpoint para que el estudiante vea su billetera activa"""
        user = request.user
        
        # Si es docente, devolver mensaje apropiado
        if user.role == 'docente':
            return Response(
                {"detail": "Los docentes no tienen billeteras. Solo los estudiantes acumulan Educoins."},
                status=status.HTTP_200_OK
            )
        
        try:
            # Buscar wallet del periodo activo
            wallet = Wallet.objects.filter(
                usuario=user,
                periodo__activo=True
            ).select_related("usuario", "grupo", "periodo").first()
            
            if not wallet:
                return Response(
                    {"detail": "No tienes una billetera activa en este momento."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = self.get_serializer(wallet)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=["post"], permission_classes=[AdminOrDocente])
    def depositar(self, request, pk=None):
        """Endpoint para que el docente agregue monedas"""
        wallet = self.get_object()
        cantidad = request.data.get("cantidad", 0)
        descripcion = request.data.get("descripcion", "Depósito del docente")
        
        if cantidad <= 0:
            return Response(
                {"detail": "La cantidad debe ser mayor a 0"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        wallet.depositar(cantidad, descripcion)
        serializer = self.get_serializer(wallet)
        return Response(serializer.data)


class CoinTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CoinTransaction.objects.all().select_related("wallet", "wallet__usuario")
    serializer_class = CoinTransactionSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == "estudiante":
            return CoinTransaction.objects.filter(wallet__usuario=user)
        return super().get_queryset()