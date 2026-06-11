from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.utils.timezone import now
from django.db import transaction
import logging

# Agrega esto al inicio del archivo
logger = logging.getLogger(__name__)

from .models import Auction, Bid
from .serializers import (
    AuctionSerializer, 
    AuctionUpdateSerializer,
    BidSerializer, 
    BidCreateSerializer
)
from apps.users.permissions import AdminOrDocente, IsDocente
from apps.tokens.models import Wallet, Period


class AuctionViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de subastas:
    - Docentes: Pueden crear, ver, editar y eliminar sus subastas
    - Estudiantes: Solo pueden ver las subastas de sus grupos
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return AuctionUpdateSerializer
        return AuctionSerializer

    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'docente':
            # Docente ve subastas de sus grupos
            return Auction.objects.filter(
                grupo__classroom__docente=user
            ).select_related('creador', 'grupo', 'grupo__classroom').prefetch_related('bids')
        
        elif user.role == 'estudiante':
            # Estudiante ve subastas de los grupos a los que pertenece
            return Auction.objects.filter(
                grupo__estudiantes=user
            ).select_related('creador', 'grupo', 'grupo__classroom').prefetch_related('bids')
        
        elif user.role == 'admin' or user.is_staff:
            return Auction.objects.all().select_related('creador', 'grupo').prefetch_related('bids')
        
        return Auction.objects.none()

    def get_permissions(self):
        """
        - CREATE, UPDATE, DELETE: Solo docentes y admin
        - LIST, RETRIEVE: Docentes, estudiantes (solo sus grupos)
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, AdminOrDocente]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """Al crear, asignar el docente como creador"""
        serializer.save(creador=self.request.user)

    def perform_update(self, serializer):
        """Validar que el docente solo pueda editar sus propias subastas"""
        auction = self.get_object()
        user = self.request.user
        
        if user.role == 'docente' and auction.creador != user:
            raise PermissionDenied("No puedes editar subastas de otros docentes.")
        
        serializer.save()

    def perform_destroy(self, instance):
        """Validar que el docente solo pueda eliminar sus propias subastas"""
        user = self.request.user
        
        if user.role == 'docente' and instance.creador != user:
            raise PermissionDenied("No puedes eliminar subastas de otros docentes.")
        
        if instance.estado == 'closed':
            raise ValidationError("No se puede eliminar una subasta cerrada.")
        
        # Devolver monedas bloqueadas antes de eliminar
        for bid in instance.bids.all():
            try:
                periodo_activo = Period.objects.filter(grupo=instance.grupo, activo=True).first()
                if periodo_activo:
                    wallet = Wallet.objects.get(
                        usuario=bid.estudiante, 
                        grupo=instance.grupo, 
                        periodo=periodo_activo
                    )
                    wallet.bloqueado_educoins -= bid.cantidad_educoins
                    wallet.save()
            except Wallet.DoesNotExist:
                pass
        
        instance.delete()

    @action(detail=True, methods=["post"], permission_classes=[AdminOrDocente])
    @transaction.atomic
    def close(self, request, pk=None):
        """
        Cerrar la subasta y procesar el ganador.
        Solo el docente creador o admin puede cerrar.
        """
        auction = self.get_object()
        user = request.user

        # Validar permisos
        if user.role == 'docente' and auction.creador != user:
            raise PermissionDenied("Solo el creador de la subasta puede cerrarla.")

        if auction.estado != "active":
            return Response(
                {"detail": "La subasta ya está cerrada."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Marcar como cerrada
        auction.estado = "closed"
        auction.save()

        # Obtener la puja más alta
        highest_bid = auction.bids.order_by("-cantidad_educoins").first()

        if not highest_bid:
            return Response({
                "detail": "Subasta cerrada sin pujas."
            }, status=status.HTTP_200_OK)

        ganador = highest_bid.estudiante
        monto = highest_bid.cantidad_educoins

        # Obtener periodo activo
        periodo_activo = Period.objects.filter(grupo=auction.grupo, activo=True).first()
        
        if not periodo_activo:
            return Response({
                "detail": "No hay periodo activo para procesar el pago."
            }, status=status.HTTP_400_BAD_REQUEST)

        # 1. Cobrar coins al ganador
        try:
            wallet_ganador = Wallet.objects.get(
                usuario=ganador, 
                grupo=auction.grupo, 
                periodo=periodo_activo
            )
            wallet_ganador.bloqueado_educoins -= monto
            wallet_ganador.saldo_educoins -= monto
            wallet_ganador.save()

            # Registrar transacción
            from apps.tokens.models import CoinTransaction
            CoinTransaction.objects.create(
                wallet=wallet_ganador,
                tipo="spend",
                cantidad_educoins=monto,
                descripcion=f"Pago por ganar subasta: {auction.titulo}"
            )
        except Wallet.DoesNotExist:
            return Response({
                "detail": "Error: El ganador no tiene billetera activa."
            }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Devolver coins a los demás participantes
        otras_pujas = auction.bids.exclude(id=highest_bid.id)
        for bid in otras_pujas:
            try:
                wallet = Wallet.objects.get(
                    usuario=bid.estudiante, 
                    grupo=auction.grupo, 
                    periodo=periodo_activo
                )
                wallet.bloqueado_educoins -= bid.cantidad_educoins
                wallet.save()
            except Wallet.DoesNotExist:
                pass

        return Response({
            "detail": f"Subasta cerrada exitosamente",
            "ganador": {
                "id": ganador.id,
                "email": ganador.email,
                "nombre": f"{ganador.first_name} {ganador.last_name}".strip(),
                "monto_pagado": monto
            },
            "total_participantes": auction.bids.count()
        }, status=status.HTTP_200_OK)


class BidViewSet(viewsets.ModelViewSet):
    """
    Gestión de pujas:
    - Estudiantes: Pueden crear su propia puja y verla
    - Docentes: Pueden crear pujas para sus estudiantes y ver todas las pujas
    """
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'docente':
            return Bid.objects.filter(
                auction__grupo__classroom__docente=user
            ).select_related('auction', 'estudiante', 'registrado_por')
        
        elif user.role == 'estudiante':
            return Bid.objects.filter(
                estudiante=user
            ).select_related('auction', 'estudiante', 'registrado_por')
        
        elif user.role == 'admin' or user.is_staff:
            return Bid.objects.all().select_related('auction', 'estudiante', 'registrado_por')
        
        return Bid.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return BidCreateSerializer
        return BidSerializer

    def create(self, request, *args, **kwargs):
        """Sobrescribir create para manejar tanto creación como actualización"""
        logger.info(f"Datos recibidos para crear/aumentar puja: {request.data}")
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error al crear/aumentar puja: {str(e)}")
            raise

    @transaction.atomic
    def perform_create(self, serializer):
        """
        Crear o aumentar puja:
        - Si el estudiante ya tiene puja: aumentar
        - Si no tiene puja: crear nueva
        """
        user = self.request.user
        auction = serializer.validated_data['auction']
        estudiante = serializer.validated_data['estudiante']
        cantidad = serializer.validated_data['cantidad']

        logger.info(f"Intentando crear/aumentar puja: usuario={user.id}, auction={auction.id}, estudiante={estudiante.id}, cantidad={cantidad}")

        # Validar permisos según rol
        if user.role == 'estudiante':
            if estudiante != user:
                logger.warning(f"Estudiante {user.id} intentó pujar por otro estudiante {estudiante.id}")
                raise PermissionDenied("Solo puedes crear pujas para ti mismo.")
        
        elif user.role == 'docente':
            if auction.grupo.classroom.docente != user:
                logger.warning(f"Docente {user.id} intentó pujar en subasta de otro grupo")
                raise PermissionDenied("No puedes crear pujas en subastas de otros grupos.")
        
        else:
            logger.warning(f"Usuario {user.id} con rol {user.role} intentó crear puja sin permisos")
            raise PermissionDenied("No tienes permiso para crear pujas.")

        # Validar que la subasta esté activa
        if auction.estado != "active":
            logger.warning(f"Subasta {auction.id} no está activa")
            raise ValidationError("Esta subasta ya no está activa.")

        if auction.fecha_fin < now():
            logger.warning(f"Subasta {auction.id} ya expiró")
            raise ValidationError("Esta subasta ya no está activa.")

        # Buscar wallet y periodo activo
        periodo_activo = Period.objects.filter(grupo=auction.grupo, activo=True).first()
        
        if not periodo_activo:
            logger.warning(f"No hay periodo activo para grupo {auction.grupo.id}")
            raise ValidationError("No hay un periodo activo para este grupo.")

        try:
            wallet = Wallet.objects.get(
                usuario=estudiante, 
                grupo=auction.grupo, 
                periodo=periodo_activo
            )
            logger.info(f"Wallet encontrada: saldo={wallet.saldo_educoins}, bloqueado={wallet.bloqueado_educoins}")
        except Wallet.DoesNotExist:
            logger.error(f"No se encontró wallet para estudiante {estudiante.id} en grupo {auction.grupo.id}")
            raise ValidationError("El estudiante no tiene una billetera activa en este grupo.")

        # Validar si el estudiante ya tiene una puja en esta subasta
        existing_bid = Bid.objects.filter(auction=auction, estudiante=estudiante).first()
        
        if existing_bid:
            # AUMENTAR PUJA EXISTENTE
            logger.info(f"Puja existente encontrada: {existing_bid.cantidad_educoins}")
            
            # Obtener la puja más alta actual (puede ser de otro estudiante)
            highest_bid = auction.bids.order_by("-cantidad_educoins").first()
            
            # Validar que la nueva cantidad sea mayor que la puja más alta actual
            if cantidad <= highest_bid.cantidad_educoins:
                error_msg = f"La nueva puja ({cantidad}) debe ser mayor que la puja actual más alta ({highest_bid.cantidad_educoins})."
                logger.warning(error_msg)
                raise ValidationError(error_msg)
            
            # Calcular la diferencia a bloquear (respecto a la puja anterior del mismo estudiante)
            diferencia = cantidad - existing_bid.cantidad_educoins
            
            # Validar saldo disponible para el aumento
            saldo_disponible = wallet.saldo_educoins - wallet.bloqueado_educoins
            logger.info(f"Saldo disponible para aumento: {saldo_disponible}, diferencia necesaria: {diferencia}")
            
            if diferencia > saldo_disponible:
                error_msg = f"Saldo insuficiente para aumentar la puja. Disponible: {saldo_disponible}, Necesario: {diferencia}"
                logger.warning(error_msg)
                raise ValidationError(error_msg)
            
            # Actualizar la puja existente
            existing_bid.cantidad_educoins = cantidad
            existing_bid.registrado_por = user
            existing_bid.save()
            
            # Bloquear monedas adicionales
            wallet.bloqueado_educoins += diferencia
            wallet.save()
            
            logger.info(f"Puja aumentada exitosamente: {existing_bid.cantidad_educoins}, bloqueado adicional: {diferencia}")
            
            # IMPORTANTE: Asignar la instancia existente al serializer
            serializer.instance = existing_bid
            
        else:
            # NUEVA PUJA
            logger.info("Creando nueva puja")
            
            # Obtener la puja más alta actual para validar el monto mínimo
            highest_bid = auction.bids.order_by("-cantidad_educoins").first()
            monto_minimo = (highest_bid.cantidad_educoins + auction.incremento_minimo_educoins) if highest_bid else auction.valor_minimo_educoins
            
            # Validar que la puja sea mayor o igual al monto mínimo requerido
            if cantidad < monto_minimo:
                error_msg = f"La puja debe ser mayor o igual a {monto_minimo} Educoins."
                logger.warning(error_msg)
                raise ValidationError(error_msg)
            
            # Validar saldo suficiente (saldo libre)
            saldo_disponible = wallet.saldo_educoins - wallet.bloqueado_educoins
            logger.info(f"Saldo disponible para nueva puja: {saldo_disponible}, cantidad solicitada: {cantidad}")
            
            if saldo_disponible < cantidad:
                error_msg = f"Saldo insuficiente. Disponible: {saldo_disponible}, Solicitado: {cantidad}"
                logger.warning(error_msg)
                raise ValidationError(error_msg)

            # Guardar la nueva puja con registro de quién la creó
            bid = serializer.save(registrado_por=user)

            # Bloquear monedas en la wallet
            wallet.bloqueado_educoins += cantidad
            wallet.save()
            
            logger.info(f"Nueva puja creada exitosamente: {bid.cantidad_educoins}, total bloqueado: {wallet.bloqueado_educoins}")

    # ... (el resto de los métodos permanecen igual)
    def perform_update(self, serializer):
        """Actualizar puja - Solo docentes pueden modificar pujas"""
        user = self.request.user
        bid = self.get_object()
        
        logger.info(f"Intentando actualizar puja {bid.id}: usuario={user.id}, rol={user.role}")
        
        if user.role != 'docente':
            logger.warning(f"Usuario {user.id} sin permisos intentó actualizar puja")
            raise PermissionDenied("Solo los docentes pueden modificar pujas.")
        
        if bid.auction.grupo.classroom.docente != user:
            logger.warning(f"Docente {user.id} intentó modificar puja de otro grupo")
            raise PermissionDenied("No puedes modificar pujas de otros grupos.")
        
        if bid.auction.estado != 'active':
            logger.warning(f"Intento de modificar puja en subasta cerrada {bid.auction.id}")
            raise ValidationError("No se pueden modificar pujas de subastas cerradas.")
        
        # Ajustar saldo bloqueado si cambia la cantidad
        old_cantidad = bid.cantidad_educoins
        new_cantidad = serializer.validated_data.get('cantidad', old_cantidad)
        
        if old_cantidad != new_cantidad:
            logger.info(f"Cambiando cantidad de puja: {old_cantidad} -> {new_cantidad}")
            periodo_activo = Period.objects.filter(grupo=bid.auction.grupo, activo=True).first()
            wallet = Wallet.objects.get(
                usuario=bid.estudiante,
                grupo=bid.auction.grupo,
                periodo=periodo_activo
            )
            
            diferencia = new_cantidad - old_cantidad
            saldo_disponible = wallet.saldo_educoins - wallet.bloqueado_educoins
            
            if diferencia > saldo_disponible:
                error_msg = f"Saldo insuficiente para aumentar la puja. Disponible: {saldo_disponible}"
                logger.warning(error_msg)
                raise ValidationError(error_msg)
            
            wallet.bloqueado_educoins += diferencia
            wallet.save()
            logger.info(f"Puja actualizada: diferencia bloqueada={diferencia}, nuevo bloqueado={wallet.bloqueado_educoins}")
        
        serializer.save()
        logger.info(f"Puja {bid.id} actualizada exitosamente")

    def perform_destroy(self, instance):
        """Eliminar puja - Solo docentes y antes de cerrar la subasta"""
        user = self.request.user
        
        logger.info(f"Intentando eliminar puja {instance.id}: usuario={user.id}, rol={user.role}")
        
        if user.role == 'estudiante':
            if instance.estudiante != user:
                logger.warning(f"Estudiante {user.id} intentó eliminar puja de otro estudiante {instance.estudiante.id}")
                raise PermissionDenied("Solo puedes retirar tus propias pujas.")
            # Estudiante retirando su propia puja - permitido
        
        if user.role == 'docente' and instance.auction.grupo.classroom.docente != user:
            logger.warning(f"Docente {user.id} intentó eliminar puja de otro grupo")
            raise PermissionDenied("No puedes eliminar pujas de otros grupos.")
        
        if instance.auction.estado != 'active':
            logger.warning(f"Intento de eliminar puja en subasta cerrada {instance.auction.id}")
            raise ValidationError("No se pueden eliminar pujas de subastas cerradas.")
        
        # Desbloquear monedas
        try:
            periodo_activo = Period.objects.filter(grupo=instance.auction.grupo, activo=True).first()
            if periodo_activo:
                wallet = Wallet.objects.get(
                    usuario=instance.estudiante,
                    grupo=instance.auction.grupo,
                    periodo=periodo_activo
                )
                wallet.bloqueado_educoins -= instance.cantidad_educoins
                wallet.save()
                logger.info(f"Monedas desbloqueadas: {instance.cantidad_educoins}, nuevo bloqueado={wallet.bloqueado_educoins}")
        except Wallet.DoesNotExist:
            logger.error(f"No se encontró wallet al eliminar puja {instance.id}")
            pass
        
        instance.delete()
        logger.info(f"Puja {instance.id} eliminada exitosamente")

    @action(detail=False, methods=['get'], url_path='por-subasta/(?P<auction_id>[^/.]+)')
    def by_auction(self, request, auction_id=None):
        """
        Obtener todas las pujas de una subasta específica.
        Docentes ven todas, estudiantes solo la suya.
        """
        user = request.user
        
        logger.info(f"Solicitando pujas por subasta: usuario={user.id}, subasta={auction_id}")
        
        try:
            auction = Auction.objects.get(pk=auction_id)
        except Auction.DoesNotExist:
            logger.warning(f"Subasta no encontrada: {auction_id}")
            return Response(
                {"detail": "Subasta no encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if user.role == 'docente':
            if auction.grupo.classroom.docente != user:
                logger.warning(f"Docente {user.id} intentó acceder a subasta de otro grupo")
                raise PermissionDenied("No tienes acceso a esta subasta.")
            bids = auction.bids.all().order_by('-cantidad_educoins')
            logger.info(f"Docente {user.id} viendo {bids.count()} pujas de subasta {auction_id}")
        
        elif user.role == 'estudiante':
            if not auction.grupo.estudiantes.filter(id=user.id).exists():
                logger.warning(f"Estudiante {user.id} intentó acceder a subasta no autorizada")
                raise PermissionDenied("No tienes acceso a esta subasta.")
            bids = auction.bids.filter(estudiante=user)
            logger.info(f"Estudiante {user.id} viendo {bids.count()} pujas propias de subasta {auction_id}")
        
        else:
            bids = auction.bids.all()
        
        serializer = self.get_serializer(bids, many=True)
        return Response(serializer.data)