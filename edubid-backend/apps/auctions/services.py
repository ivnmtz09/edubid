import logging
from django.db import transaction
from django.utils import timezone
from apps.auctions.models import Auction
from apps.tokens.models import Wallet, Period, CoinTransaction
from apps.notifications.models import Notification

logger = logging.getLogger(__name__)


@transaction.atomic
def cerrar_subasta(auction: Auction) -> dict:
    """
    Cierra una subasta activa y procesa de forma transaccional el cobro al ganador
    y la liberación de fondos retenidos de los demás participantes.

    1. Si ya está cerrada, retorna sin procesar.
    2. Cambia el estado de la subasta a 'closed'.
    3. Si no hubo pujas:
       - Notifica al creador/docente que finalizó sin ofertas.
       - Retorna indicando que no hubo ganador.
    4. Si hubo pujas:
       - Identifica la puja más alta (ganador).
       - Descuenta EduCoins del ganador (saldo_educoins y bloqueado_educoins).
       - Registra la transacción CoinTransaction de tipo 'spend'.
       - Desbloquea los EduCoins retenidos de los demás participantes (bloqueado_educoins).
       - Envía notificaciones al ganador, a los demás postores y al docente creador.
    """
    if auction.estado != "active":
        return {
            "success": False,
            "already_closed": True,
            "message": f"La subasta '{auction.titulo}' ya se encuentra cerrada."
        }

    auction.estado = "closed"
    auction.save(update_fields=["estado", "actualizado"])

    highest_bid = auction.bids.order_by("-cantidad_educoins").first()

    if not highest_bid:
        # Notificar al creador/docente
        try:
            Notification.objects.create(
                usuario=auction.creador,
                tipo='subasta_abierta',
                titulo='Subasta finalizada sin ofertas',
                mensaje=f'Tu subasta "{auction.titulo}" ha finalizado sin ofertas registradas.',
                institucion_id=auction.creador.institucion_id if auction.creador else None,
                auction_id=auction.id,
                metadata={
                    'auction_titulo': auction.titulo,
                    'resultado': 'sin_pujas'
                }
            )
        except Exception as e:
            logger.error("Error al crear notificación de subasta sin ofertas: %s", e)

        return {
            "success": True,
            "ganador": None,
            "monto": 0,
            "message": "Subasta cerrada sin pujas.",
            "total_participantes": 0
        }

    ganador = highest_bid.estudiante
    monto = highest_bid.cantidad_educoins

    # Buscar periodo activo del grupo o el más reciente
    periodo_activo = Period.objects.filter(grupo=auction.grupo, activo=True).first()
    if not periodo_activo:
        periodo_activo = Period.objects.filter(grupo=auction.grupo).order_by('-fecha_fin').first()

    if not periodo_activo:
        logger.error("No se encontró periodo para procesar subasta %s", auction.id)
        return {
            "success": False,
            "error": "No hay periodos registrados para este grupo."
        }

    # 1. Cobrar EduCoins al ganador
    try:
        wallet_ganador = Wallet.objects.select_for_update().get(
            usuario=ganador,
            grupo=auction.grupo,
            periodo=periodo_activo
        )
        wallet_ganador.bloqueado_educoins = max(0, wallet_ganador.bloqueado_educoins - monto)
        wallet_ganador.saldo_educoins = max(0, wallet_ganador.saldo_educoins - monto)
        wallet_ganador.save()

        CoinTransaction.objects.create(
            wallet=wallet_ganador,
            tipo="spend",
            cantidad_educoins=monto,
            descripcion=f"Pago por ganar subasta: {auction.titulo}"
        )
    except Wallet.DoesNotExist:
        logger.error("No se encontró wallet activa para el ganador %s en subasta %s", ganador.id, auction.id)

    # 2. Devolver coins bloqueadas a los demás participantes
    otras_pujas = auction.bids.exclude(id=highest_bid.id)
    for bid in otras_pujas:
        try:
            wallet = Wallet.objects.select_for_update().get(
                usuario=bid.estudiante,
                grupo=auction.grupo,
                periodo=periodo_activo
            )
            wallet.bloqueado_educoins = max(0, wallet.bloqueado_educoins - bid.cantidad_educoins)
            wallet.save()

            # Notificar devolución de saldo
            try:
                Notification.objects.create(
                    usuario=bid.estudiante,
                    tipo='subasta_abierta',
                    titulo='Subasta finalizada',
                    mensaje=f'La subasta "{auction.titulo}" ha finalizado. Tus {bid.cantidad_educoins} EduCoins retenidos han sido liberados.',
                    institucion_id=bid.estudiante.institucion_id if bid.estudiante else None,
                    auction_id=auction.id,
                    metadata={
                        'auction_titulo': auction.titulo,
                        'cantidad_devuelta': bid.cantidad_educoins
                    }
                )
            except Exception as e:
                logger.error("Error al notificar devolución a estudiante %s: %s", bid.estudiante_id, e)

        except Wallet.DoesNotExist:
            logger.warning("No se encontró wallet para devolver fondos a estudiante %s", bid.estudiante_id)

    # 3. Notificar al ganador
    try:
        Notification.objects.create(
            usuario=ganador,
            tipo='subasta_ganada',
            titulo='¡Has ganado la subasta!',
            mensaje=f'¡Felicitaciones! Has ganado la subasta "{auction.titulo}" con una puja de {monto} EduCoins.',
            institucion_id=ganador.institucion_id if ganador else None,
            auction_id=auction.id,
            metadata={
                'auction_titulo': auction.titulo,
                'monto_pagado': monto,
                'grupo_nombre': auction.grupo.nombre if auction.grupo else ''
            }
        )
    except Exception as e:
        logger.error("Error al notificar al ganador %s: %s", ganador.id, e)

    # 4. Notificar al docente creador
    try:
        Notification.objects.create(
            usuario=auction.creador,
            tipo='subasta_abierta',
            titulo='Subasta finalizada con ganador',
            mensaje=f'Tu subasta "{auction.titulo}" ha finalizado. Ganador: {ganador.get_full_name() or ganador.email} con {monto} EduCoins.',
            institucion_id=auction.creador.institucion_id if auction.creador else None,
            auction_id=auction.id,
            metadata={
                'auction_titulo': auction.titulo,
                'ganador_id': ganador.id,
                'ganador_email': ganador.email,
                'monto_pagado': monto
            }
        )
    except Exception as e:
        logger.error("Error al notificar al docente creador: %s", e)

    resultado = {
        "success": True,
        "ganador": {
            "id": ganador.id,
            "email": ganador.email,
            "nombre": f"{ganador.first_name} {ganador.last_name}".strip(),
            "monto_pagado": monto
        },
        "total_participantes": auction.bids.count()
    }
    broadcast_auction_closed(auction, resultado)
    return resultado


def cerrar_subastas_expiradas() -> list:
    """
    Busca todas las subastas activas cuya fecha_fin sea menor o igual a la fecha/hora actual
    y las cierra automáticamente ejecutando cerrar_subasta().
    """
    ahora = timezone.now()
    subastas_expiradas = Auction.objects.filter(estado="active", fecha_fin__lte=ahora)

    resultados = []
    total = subastas_expiradas.count()
    if total > 0:
        logger.info("Procesando %d subastas expiradas para cierre automático.", total)

    for auction in subastas_expiradas:
        try:
            res = cerrar_subasta(auction)
            resultados.append({"auction_id": auction.id, "resultado": res})
            logger.info("Subasta %d (%s) cerrada automáticamente.", auction.id, auction.titulo)
        except Exception as e:
            logger.error("Error cerrando subasta expirada %d: %s", auction.id, str(e), exc_info=True)
            resultados.append({"auction_id": auction.id, "error": str(e)})

    return resultados


def broadcast_bid_update(auction: Auction, estudiante, cantidad: int, estudiante_anterior_id: int = None):
    """
    Emite un evento de actualización de puja a través de Django Channels
    para sincronización en tiempo real.
    """
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        nombre_estudiante = f"{estudiante.first_name} {estudiante.last_name}".strip() or estudiante.username
        payload = {
            "type": "bid_update",
            "data": {
                "event": "bid_created",
                "auction_id": auction.id,
                "auction_titulo": auction.titulo,
                "grupo_id": auction.grupo_id,
                "puja_mas_alta": {
                    "cantidad_educoins": cantidad,
                    "estudiante_nombre": nombre_estudiante,
                    "estudiante_id": estudiante.id,
                },
                "total_pujas": auction.bids.count(),
                "incremento_minimo_educoins": auction.incremento_minimo_educoins,
                "estudiante_anterior_id": estudiante_anterior_id,
            }
        }

        async_to_sync(channel_layer.group_send)("auctions_general", payload)
        if auction.grupo_id:
            async_to_sync(channel_layer.group_send)(f"auctions_group_{auction.grupo_id}", payload)
    except Exception as e:
        logger.warning("No se pudo emitir evento WebSocket de puja: %s", e)


def broadcast_auction_closed(auction: Auction, resultado: dict):
    """
    Emite un evento de cierre de subasta a través de Django Channels.
    """
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        payload = {
            "type": "auction_closed",
            "data": {
                "event": "auction_closed",
                "auction_id": auction.id,
                "auction_titulo": auction.titulo,
                "grupo_id": auction.grupo_id,
                "ganador": resultado.get("ganador"),
                "total_participantes": resultado.get("total_participantes", 0)
            }
        }

        async_to_sync(channel_layer.group_send)("auctions_general", payload)
        if auction.grupo_id:
            async_to_sync(channel_layer.group_send)(f"auctions_group_{auction.grupo_id}", payload)
    except Exception as e:
        logger.warning("No se pudo emitir evento WebSocket de cierre: %s", e)
