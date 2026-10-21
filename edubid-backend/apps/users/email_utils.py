import logging
from datetime import datetime
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils.html import strip_tags

# Configurar logger
logger = logging.getLogger(__name__)


def send_verification_email_api(user, token):
    """Envía email de verificación de correo electrónico con código OTP de 6 dígitos (válido por 1 hora)."""
    try:
        code = getattr(token, 'code', None) or str(token.token)[:6]
        verification_link = f"{settings.FRONTEND_URL}/verify-email/{token.token}"
        year = datetime.now().year
        subject = f'{code} es tu código de verificación — EduBid'

        html_content = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f3f4f6; margin: 0; padding: 0; }}
                .wrapper {{ max-width: 600px; margin: 40px auto; padding: 0 20px; }}
                .card {{ background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }}
                .card-header {{ background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 32px 40px; text-align: center; }}
                .card-header h1 {{ color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }}
                .card-header p {{ color: rgba(255,255,255,0.9); font-size: 13px; margin: 6px 0 0 0; font-weight: 500; }}
                .card-body {{ padding: 36px 40px; }}
                .card-body h2 {{ color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 12px; }}
                .card-body p {{ color: #4b5563; font-size: 15px; margin: 0 0 16px; }}
                .code-container {{ margin: 28px 0; text-align: center; }}
                .code-box {{ display: inline-block; padding: 16px 28px; background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #ea580c; font-family: 'Courier New', Courier, monospace; box-shadow: 0 2px 8px rgba(234, 88, 12, 0.08); }}
                .expiry-pill {{ display: inline-block; margin-top: 12px; padding: 4px 12px; background: #fef3c7; border-radius: 9999px; font-size: 12px; font-weight: 600; color: #b45309; }}
                .note {{ font-size: 13px; color: #6b7280; margin-top: 14px; }}
                .footer {{ background: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; }}
                .footer p {{ color: #9ca3af; font-size: 12px; margin: 4px 0; }}
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="card">
                    <div class="card-header">
                        <h1>EduBid</h1>
                        <p>Plataforma Educativa Gamificada</p>
                    </div>
                    <div class="card-body">
                        <h2>Verifica tu correo electrónico</h2>
                        <p>Hola <strong>{user.first_name}</strong>,</p>
                        <p>Gracias por unirte a <strong>EduBid</strong>. Ingresa el siguiente código de 6 dígitos en la plataforma para verificar tu correo y acceder a tu cuenta automáticamente:</p>
                        
                        <div class="code-container">
                            <div class="code-box">{code}</div>
                            <br>
                            <span class="expiry-pill">⏱️ Código válido por 1 hora</span>
                        </div>

                        <p class="note">Si no solicitaste este código, puedes ignorar este mensaje de forma segura.</p>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático de seguridad, por favor no respondas a este mensaje.</p>
                        <p>&copy; {year} EduBid &mdash; Todos los derechos reservados.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = strip_tags(html_content)
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user.email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info("Email de verificación enviado a %s", user.email)
        return True
    except Exception as e:
        logger.error("Error enviando verificación: %s", e)
        return False


def send_welcome_email_api(user, is_google_signup=False):
    """Envía email de bienvenida al nuevo usuario."""
    try:
        dashboard_link = f"{settings.FRONTEND_URL}/dashboard"
        signup_method = "Google" if is_google_signup else "registro con correo y contraseña"
        year = datetime.now().year
        subject = f'Bienvenido a EduBid — Tu cuenta está lista'

        html_content = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f3f4f6; margin: 0; padding: 0; }}
                .wrapper {{ max-width: 600px; margin: 40px auto; padding: 0 20px; }}
                .card {{ background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }}
                .card-header {{ background: #ea580c; padding: 32px 40px; text-align: center; }}
                .card-header h1 {{ color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }}
                .card-header p {{ color: rgba(255,255,255,0.85); font-size: 13px; margin: 6px 0 0 0; }}
                .card-body {{ padding: 40px; }}
                .card-body h2 {{ color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 16px; }}
                .card-body h3 {{ color: #111827; font-size: 16px; font-weight: 600; margin: 24px 0 12px; }}
                .card-body p {{ color: #374151; font-size: 15px; margin: 0 0 16px; }}
                .feature {{ background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; margin: 8px 0; }}
                .feature strong {{ color: #111827; font-size: 14px; display: block; margin-bottom: 4px; }}
                .feature span {{ color: #6b7280; font-size: 13px; }}
                .btn {{ display: inline-block; padding: 14px 36px; background: #ea580c; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; }}
                .btn-wrapper {{ text-align: center; margin: 28px 0; }}
                .footer {{ background: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; }}
                .footer p {{ color: #9ca3af; font-size: 12px; margin: 4px 0; }}
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="card">
                    <div class="card-header">
                        <h1>EduBid</h1>
                        <p>Gamificación Educativa</p>
                    </div>
                    <div class="card-body">
                        <h2>Cuenta activada exitosamente</h2>
                        <p>Hola {user.first_name},</p>
                        <p>Tu cuenta en <strong>EduBid</strong> ha sido creada exitosamente mediante {signup_method}. Ya puedes acceder a la plataforma.</p>
                        <h3>¿Qué puedes hacer en EduBid?</h3>
                        <div class="feature">
                            <strong>Gana EduCoins</strong>
                            <span>Completa actividades académicas y obtén EduCoins proporcionales a tu calificación.</span>
                        </div>
                        <div class="feature">
                            <strong>Participa en Subastas</strong>
                            <span>Usa tus EduCoins para pujar en subastas de incentivos creadas por tus docentes.</span>
                        </div>
                        <div class="feature">
                            <strong>Únete a Grupos</strong>
                            <span>Ingresa a grupos de clase con el código que te proporcione tu docente.</span>
                        </div>
                        <div class="btn-wrapper">
                            <a href="{dashboard_link}" class="btn">Ir a mi panel</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                        <p>&copy; {year} EduBid &mdash; Gamificación Educativa</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = strip_tags(html_content)
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user.email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info("Email de bienvenida enviado a %s", user.email)
        return True
    except Exception as e:
        logger.error("Error enviando bienvenida: %s", e)
        return False


def send_password_reset_email_api(user, reset_link):
    """Envía email de restablecimiento de contraseña."""
    try:
        year = datetime.now().year
        subject = 'Restablece tu contraseña — EduBid'

        html_content = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f3f4f6; margin: 0; padding: 0; }}
                .wrapper {{ max-width: 600px; margin: 40px auto; padding: 0 20px; }}
                .card {{ background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }}
                .card-header {{ background: #1f2937; padding: 32px 40px; text-align: center; }}
                .card-header h1 {{ color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }}
                .card-header p {{ color: rgba(255,255,255,0.7); font-size: 13px; margin: 6px 0 0 0; }}
                .card-body {{ padding: 40px; }}
                .card-body h2 {{ color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 16px; }}
                .card-body p {{ color: #374151; font-size: 15px; margin: 0 0 16px; }}
                .btn {{ display: inline-block; padding: 14px 36px; background: #ea580c; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; }}
                .btn-wrapper {{ text-align: center; margin: 28px 0; }}
                .link-box {{ background: #f9fafb; padding: 12px 16px; border-radius: 8px; word-break: break-all; font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; font-family: monospace; }}
                .alert {{ background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; margin-top: 16px; }}
                .alert p {{ color: #92400e; font-size: 13px; margin: 0; }}
                .note {{ font-size: 13px; color: #6b7280; }}
                .footer {{ background: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; }}
                .footer p {{ color: #9ca3af; font-size: 12px; margin: 4px 0; }}
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="card">
                    <div class="card-header">
                        <h1>EduBid</h1>
                        <p>Seguridad de cuenta</p>
                    </div>
                    <div class="card-body">
                        <h2>Restablece tu contraseña</h2>
                        <p>Hola {user.first_name},</p>
                        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>EduBid</strong>. Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                        <div class="btn-wrapper">
                            <a href="{reset_link}" class="btn">Restablecer contraseña</a>
                        </div>
                        <p class="note">O copia y pega este enlace en tu navegador:</p>
                        <div class="link-box">{reset_link}</div>
                        <div class="alert">
                            <p><strong>Este enlace expirará en 1 hora.</strong> Si no solicitaste este cambio, puedes ignorar este correo — tu contraseña permanecerá igual.</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                        <p>&copy; {year} EduBid &mdash; Gamificación Educativa</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = strip_tags(html_content)
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user.email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info("Email de reset enviado a %s", user.email)
        return True
    except Exception as e:
        logger.error("Error enviando reset: %s", e)
        return False


def send_account_deletion_confirmation_email_api(user):
    """Envía confirmación de eliminación de cuenta."""
    try:
        year = datetime.now().year
        subject = 'Cuenta eliminada — EduBid'

        html_content = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f3f4f6; margin: 0; padding: 0; }}
                .wrapper {{ max-width: 600px; margin: 40px auto; padding: 0 20px; }}
                .card {{ background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }}
                .card-header {{ background: #374151; padding: 32px 40px; text-align: center; }}
                .card-header h1 {{ color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; }}
                .card-header p {{ color: rgba(255,255,255,0.7); font-size: 13px; margin: 6px 0 0 0; }}
                .card-body {{ padding: 40px; }}
                .card-body h2 {{ color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 16px; }}
                .card-body p {{ color: #374151; font-size: 15px; margin: 0 0 16px; }}
                .footer {{ background: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; }}
                .footer p {{ color: #9ca3af; font-size: 12px; margin: 4px 0; }}
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="card">
                    <div class="card-header">
                        <h1>EduBid</h1>
                        <p>Confirmación de cuenta</p>
                    </div>
                    <div class="card-body">
                        <h2>Tu cuenta ha sido eliminada</h2>
                        <p>Hola {user.first_name},</p>
                        <p>Te confirmamos que tu cuenta en <strong>EduBid</strong> ha sido eliminada exitosamente de acuerdo con tu solicitud.</p>
                        <p>Todos tus datos personales han sido removidos de nuestros sistemas conforme a nuestra política de privacidad y la Ley 1581 de 2012 (Habeas Data).</p>
                        <p>Si en el futuro deseas volver a usar EduBid, puedes crear una nueva cuenta desde la plataforma.</p>
                        <p>Gracias por haber sido parte de nuestra comunidad educativa.</p>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                        <p>&copy; {year} EduBid &mdash; Gamificación Educativa</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = strip_tags(html_content)
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user.email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info("Email de eliminación enviado a %s", user.email)
        return True
    except Exception as e:
        logger.error("Error enviando confirmación eliminación: %s", e)
        return False
