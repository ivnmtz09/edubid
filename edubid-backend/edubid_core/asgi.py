import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edubid_core.settings')

# Inicializar aplicación ASGI de Django antes de importar enrutadores de Channels
django_asgi_app = get_asgi_application()

from apps.auctions.routing import websocket_urlpatterns
from apps.auctions.ws_auth import JWTQueryAuthMiddleware

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTQueryAuthMiddleware(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
