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
        
        base_qs = Period.objects.select_related('grupo', 'grupo__classroom', 'grupo__classroom__docente').order_by("-creado")
        
        # Admin ve todos los periodos
        if user.is_staff or user.role == 'admin':
            return base_qs.all()
            
        # Rector y coordinador ven periodos de su institución
        if user.role in ['rector', 'coordinador']:
            if user.institucion_id:
                return base_qs.filter(
                    grupo__classroom__docente__institucion_id=user.institucion_id
                )
            return Period.objects.none()
        
        # Docente solo ve periodos de sus grupos
        if user.role == 'docente':
            return base_qs.filter(
                grupo__classroom__docente=user
            )
        
        # Estudiantes ven periodos de sus grupos
        if user.role == 'estudiante':
            return base_qs.filter(
                grupo__estudiantes=user
            )
        
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
        qs = Wallet.objects.none()
        if user.role == 'admin':
            qs = Wallet.objects.all()
        elif user.role in ['rector', 'coordinador']:
            if user.institucion_id:
                qs = Wallet.objects.filter(
                    grupo__classroom__docente__institucion_id=user.institucion_id
                )
        elif user.role == 'docente':
            qs = Wallet.objects.filter(
                grupo__classroom__docente=user
            )
        elif user.role == "estudiante":
            qs = Wallet.objects.filter(usuario=user)

        # Filtros opcionales por query params
        grupo_id = self.request.query_params.get('grupo')
        if grupo_id:
            qs = qs.filter(grupo_id=grupo_id)
        classroom_id = self.request.query_params.get('classroom')
        if classroom_id:
            qs = qs.filter(grupo__classroom_id=classroom_id)

        return qs.select_related("usuario", "grupo", "periodo")

    @action(detail=False, methods=["get"], url_path="mi-wallet", permission_classes=[permissions.IsAuthenticated])
    def mi_wallet(self, request):
        """Endpoint para que el estudiante vea su billetera activa"""
        user = request.user
        
        # Si es docente o administrativo, devolver mensaje informativo
        if user.role in ['docente', 'rector', 'coordinador', 'admin']:
            return Response(
                {"detail": "Los roles administrativos no tienen billeteras de estudiante. Consulta el listado general de billeteras."},
                status=status.HTTP_200_OK
            )
        
        try:
            grupo_id = request.query_params.get('grupo')
            
            qs = Wallet.objects.filter(usuario=user)
            if grupo_id:
                qs = qs.filter(grupo_id=grupo_id)
                
            # 1. Buscar wallet del periodo activo
            wallet = qs.filter(periodo__activo=True).select_related("usuario", "grupo", "periodo").first()
            
            # 2. Si no hay con periodo activo, buscar la más reciente
            if not wallet:
                wallet = qs.select_related("usuario", "grupo", "periodo").order_by('-periodo__fecha_fin', '-id').first()
                
            # 3. Si no existe wallet pero el estudiante está inscrito en un grupo, auto-crearla
            if not wallet:
                grupo = None
                if grupo_id:
                    grupo = user.estudiante_grupos.filter(id=grupo_id).first()
                else:
                    grupo = user.estudiante_grupos.first()
                    
                if grupo:
                    periodo_activo = Period.objects.filter(grupo=grupo, activo=True).first()
                    if not periodo_activo:
                        periodo_activo = Period.objects.filter(grupo=grupo).order_by('-fecha_fin').first()
                    if not periodo_activo:
                        periodos = Period.crear_periodos_para_grupo(grupo)
                        periodo_activo = Period.objects.filter(grupo=grupo, activo=True).first() or (periodos[0] if periodos else None)
                        
                    if periodo_activo:
                        wallet, _ = Wallet.objects.get_or_create(
                            usuario=user,
                            grupo=grupo,
                            periodo=periodo_activo,
                            defaults={'saldo_educoins': 0, 'bloqueado_educoins': 0}
                        )
            
            if not wallet:
                return Response({
                    "id": None,
                    "saldo_educoins": 0,
                    "bloqueado_educoins": 0,
                    "saldo_disponible": 0,
                    "transacciones": [],
                    "detail": "Aún no tienes una billetera activa. Únete a una clase para comenzar.",
                    "sin_wallet": True,
                }, status=status.HTTP_200_OK)
            
            serializer = self.get_serializer(wallet)
            return Response(serializer.data)
        except Exception as e:
            logger.warning("Error resolviendo billetera para %s: %s", getattr(user, 'email', 'desconocido'), e)
            return Response({
                "id": None,
                "saldo_educoins": 0,
                "bloqueado_educoins": 0,
                "saldo_disponible": 0,
                "transacciones": [],
                "detail": "Aún no tienes una billetera activa. Únete a una clase para comenzar.",
                "sin_wallet": True,
            }, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="mi_wallet", permission_classes=[permissions.IsAuthenticated])
    def mi_wallet_alias(self, request):
        """Alias para soportar llamadas con guion bajo"""
        return self.mi_wallet(request)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def depositar(self, request, pk=None):
        """Endpoint reservado solo para administradores del sistema.
        Los docentes NO pueden depositar EduCoins manualmente.
        Los EduCoins se acreditan exclusivamente al calificar actividades."""
        wallet = self.get_object()
        
        # Verify that the docente owns the classroom this wallet belongs to
        if request.user.role == 'docente' and wallet.grupo.classroom.docente != request.user:
            raise ValidationError("No tienes permiso para depositar en esta billetera.")
            
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
    queryset = CoinTransaction.objects.all().select_related("wallet", "wallet__usuario", "wallet__grupo", "wallet__periodo")
    serializer_class = CoinTransactionSerializer
    
    def get_queryset(self):
        user = self.request.user
        base_qs = CoinTransaction.objects.select_related("wallet", "wallet__usuario", "wallet__grupo", "wallet__periodo")
        if user.role == 'admin':
            return base_qs.all()
        elif user.role in ['rector', 'coordinador']:
            if user.institucion_id:
                return base_qs.filter(
                    wallet__grupo__classroom__docente__institucion_id=user.institucion_id
                )
            return CoinTransaction.objects.none()
        elif user.role == 'docente':
            return base_qs.filter(
                wallet__grupo__classroom__docente=user
            )
        elif user.role == "estudiante":
            return base_qs.filter(wallet__usuario=user)
        return CoinTransaction.objects.none()