from django.core.cache import cache
from rest_framework.throttling import SimpleRateThrottle


class AuthRateThrottle(SimpleRateThrottle):
    """
    Limita la tasa de peticiones para endpoints de autenticación (/login, /register, /google, /resend-verification)
    identificando a los clientes por su dirección IP para mitigar ataques de fuerza bruta.
    """
    scope = 'auth'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        if not ident:
            return None
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class PasswordResetRateThrottle(SimpleRateThrottle):
    """
    Limita la tasa de peticiones para endpoints de restablecimiento de contraseña
    para mitigar spam y abusos de email por dirección IP.
    """
    scope = 'password_reset'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        if not ident:
            return None
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }



class ReportRateThrottle(SimpleRateThrottle):
    """Limita el envio de reportes (endpoint publico que dispara correos) por IP."""
    scope = 'report'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        if not ident:
            return None
        return self.cache_format % {'scope': self.scope, 'ident': ident}


class JoinCodeAttemptLimiter:
    """
    Limita los codigos de grupo incorrectos por usuario: los codigos son cortos (6 hex) y sin esto
    se podrian adivinar por fuerza bruta para entrar a grupos ajenos.
    """
    MAX_FAILURES = 10
    WINDOW_SECONDS = 60 * 60

    @staticmethod
    def _key(user_id) -> str:
        return f"join_fail:{user_id}"

    @classmethod
    def is_blocked(cls, user_id) -> bool:
        return cache.get(cls._key(user_id), 0) >= cls.MAX_FAILURES

    @classmethod
    def register_failure(cls, user_id) -> None:
        key = cls._key(user_id)
        cache.add(key, 0, cls.WINDOW_SECONDS)
        try:
            cache.incr(key)
        except ValueError:
            cache.set(key, 1, cls.WINDOW_SECONDS)


class OTPAttemptLimiter:
    """
    Limita los intentos fallidos de codigo OTP por correo (independiente de la IP), para que
    un codigo de 6 digitos no pueda adivinarse por fuerza bruta.
    """
    MAX_FAILURES = 5
    WINDOW_SECONDS = 15 * 60

    @staticmethod
    def _key(email: str) -> str:
        return f"otp_fail:{email}"

    @classmethod
    def is_blocked(cls, email: str) -> bool:
        return cache.get(cls._key(email), 0) >= cls.MAX_FAILURES

    @classmethod
    def register_failure(cls, email: str) -> None:
        key = cls._key(email)
        cache.add(key, 0, cls.WINDOW_SECONDS)
        try:
            cache.incr(key)
        except ValueError:
            cache.set(key, 1, cls.WINDOW_SECONDS)

    @classmethod
    def clear(cls, email: str) -> None:
        cache.delete(cls._key(email))
