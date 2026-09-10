import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)


class AuctionConsumer(AsyncJsonWebsocketConsumer):
    """
    Consumidor WebSocket para subastas en tiempo real:
    - Permite recibir actualizaciones instantáneas de nuevas pujas (bid_update).
    - Permite recibir eventos de cierre de subasta (auction_closed).
    - Permite recibir anuncios de nuevas subastas (auction_created).
    """

    async def connect(self):
        self.group_id = self.scope['url_route']['kwargs'].get('group_id')
        self.rooms = ["auctions_general"]

        if self.group_id:
            self.rooms.append(f"auctions_group_{self.group_id}")

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

