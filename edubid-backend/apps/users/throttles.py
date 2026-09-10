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

