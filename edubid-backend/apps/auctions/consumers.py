import logging
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.groups.models import Group

logger = logging.getLogger(__name__)


@database_sync_to_async
def _allowed_group_ids(user):
    """IDs de los grupos cuyas subastas puede ver el usuario según su rol e institución."""
    if user.is_staff or user.role == 'admin':
        return None  # sin restricción
    if user.role in ('rector', 'coordinador'):
        if not user.institucion_id:
            return set()
        qs = Group.objects.filter(classroom__docente__institucion_id=user.institucion_id)
    elif user.role == 'docente':
        qs = Group.objects.filter(classroom__docente=user)
    elif user.role == 'estudiante':
        qs = Group.objects.filter(estudiantes=user)
    else:
        return set()
    return set(qs.values_list('id', flat=True))


class AuctionConsumer(AsyncJsonWebsocketConsumer):
    """
    Consumidor WebSocket para subastas en tiempo real:
    - Permite recibir actualizaciones instantáneas de nuevas pujas (bid_update).
    - Permite recibir eventos de cierre de subasta (auction_closed).
    - Permite recibir anuncios de nuevas subastas (auction_created).
    """

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return

        requested = self.scope['url_route']['kwargs'].get('group_id')
        allowed = await _allowed_group_ids(user)  # None = admin (todos los grupos)

        self.group_id = requested
        self.rooms = []
        if allowed is None:
            self.rooms.append("auctions_general")
            if requested:
                self.rooms.append(f"auctions_group_{requested}")
        else:
            if requested and requested not in allowed:
                await self.close(code=4403)
                return
            ids = {requested} if requested else allowed
            self.rooms.extend(f"auctions_group_{gid}" for gid in ids)

        for room in self.rooms:
            await self.channel_layer.group_add(room, self.channel_name)

        await self.accept()
        logger.info(f"WebSocket conectado a salas: {self.rooms} (Canal: {self.channel_name})")

        await self.send_json({
            "type": "connection_established",
            "message": "Conectado al canal en tiempo real de subastas EduBid",
            "group_id": self.group_id
        })

    async def disconnect(self, close_code):
        if hasattr(self, 'rooms'):
            for room in self.rooms:
                await self.channel_layer.group_discard(room, self.channel_name)
        logger.info(f"WebSocket desconectado (Código: {close_code})")

    async def receive_json(self, content, **kwargs):
        """Maneja mensajes enviados desde el cliente (p. ej. ping de heartbeat)"""
        msg_type = content.get("type")
        if msg_type == "ping":
            await self.send_json({"type": "pong"})

    # ── Manejadores de eventos emitidos desde el Channel Layer ───────────────

    async def bid_update(self, event):
        """Reenvía la notificación de nueva puja a todos los clientes suscritos"""
        await self.send_json(event["data"])

    async def auction_closed(self, event):
        """Reenvía la notificación de cierre de subasta a todos los clientes suscritos"""
        await self.send_json(event["data"])

    async def auction_created(self, event):
        """Reenvía la notificación de creación de subasta a todos los clientes suscritos"""
        await self.send_json(event["data"])

