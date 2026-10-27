from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


@database_sync_to_async
def _get_user(token: str):
    try:
        user_id = AccessToken(token)["user_id"]
        user = User.objects.get(id=user_id, is_active=True)
    except Exception:
        return AnonymousUser()
    return user


class JWTQueryAuthMiddleware(BaseMiddleware):
    """Autentica conexiones WebSocket con el JWT de acceso enviado en `?token=`."""

    async def __call__(self, scope, receive, send):
        params = parse_qs(scope.get("query_string", b"").decode())
        token = (params.get("token") or [None])[0]
        scope["user"] = await _get_user(token) if token else AnonymousUser()
        return await super().__call__(scope, receive, send)
