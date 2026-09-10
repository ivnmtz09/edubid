from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/auctions/', consumers.AuctionConsumer.as_asgi()),
    path('ws/auctions/<int:group_id>/', consumers.AuctionConsumer.as_asgi()),
]

