"""
Utilidades para crear notificaciones de seguridad y cuenta
"""
from .models import Notification


def _institucion(user):
    return user.institucion if user.institucion_id else None


def notificar_email_verificado(user):
    Notification.objects.create(
        usuario=user,
        institucion=_institucion(user),
        tipo='email_verificado',
        titulo='Email verificado exitosamente',
        mensaje=f'Tu correo electrónico {user.email} ha sido verificado. ¡Bienvenido a Educoin!',
        metadata={
            'email': user.email,
            'nombre_completo': f'{user.first_name} {user.last_name}'
        }
    )


def notificar_password_changed(user, ip_address=None):
    Notification.objects.create(
        usuario=user,
        institucion=_institucion(user),
        tipo='password_changed',
        titulo='Contraseña actualizada',
        mensaje='Tu contraseña ha sido cambiada exitosamente. Si no realizaste este cambio, contacta a soporte inmediatamente.',
        metadata={
            'ip_address': ip_address,
            'cambio_desde': 'perfil'
        }
    )


def notificar_password_reset(user, ip_address=None):
    Notification.objects.create(
        usuario=user,
        institucion=_institucion(user),
        tipo='password_reset',
        titulo='Contraseña restablecida',
        mensaje='Tu contraseña ha sido restablecida exitosamente. Si no solicitaste este cambio, contacta a soporte inmediatamente.',
        metadata={
            'ip_address': ip_address,
            'metodo': 'reset_link'
        }
    )


def notificar_registro_exitoso(user, is_google=False):
    metodo = "Google" if is_google else "email"
    Notification.objects.create(
        usuario=user,
        institucion=_institucion(user),
        tipo='general',
        titulo='¡Bienvenido a Educoin!',
        mensaje=f'Tu cuenta ha sido creada exitosamente mediante {metodo}. ¡Comienza tu aventura de aprendizaje ahora!',
        metadata={
            'metodo_registro': metodo,
            'email': user.email,
            'nombre': f'{user.first_name} {user.last_name}'
        }
    )


def notificar_solicitud_password_reset(user, ip_address=None):
    Notification.objects.create(
        usuario=user,
        institucion=_institucion(user),
        tipo='account_security',
        titulo='Solicitud de restablecimiento de contraseña',
        mensaje='Se ha solicitado restablecer tu contraseña. Si no fuiste tú, ignora este mensaje y tu cuenta permanecerá segura.',
        metadata={
            'ip_address': ip_address,
            'accion': 'solicitud_reset'
        }
    )


def notificar_login_exitoso(user, ip_address=None):
    Notification.objects.create(
        usuario=user,
        institucion=_institucion(user),
        tipo='account_security',
        titulo='Nuevo inicio de sesión',
        mensaje=f'Se ha iniciado sesión en tu cuenta. Si no fuiste tú, cambia tu contraseña inmediatamente.',
        metadata={
            'ip_address': ip_address,
            'tipo_login': 'exitoso'
        }
    )


def notificar_cuenta_eliminada(email, nombre):
    """
    Esta no crea una notificación porque la cuenta ya está eliminada,
    pero la dejamos por si queremos implementar un log externo
    """
    pass  # La cuenta ya no existe para crear notificaciones