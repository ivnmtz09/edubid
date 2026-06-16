import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils.html import strip_tags

# Configurar logger
logger = logging.getLogger(__name__)

def send_verification_email_api(user, token):
    """Envía email de verificación usando el SMTP de Django"""
    try:
        logger.info("INICIANDO ENVÍO VÍA GMAIL SMTP")
        logger.info(f"Destinatario: {user.email}")
        
        verification_link = f"{settings.FRONTEND_URL}/verify-email/{token.token}"
        subject = '🎓 Verifica tu correo - Educoin'
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
                .card {{ background: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }}
                .logo {{ font-size: 22px; font-weight: 700; color: #ea580c; text-align: center; letter-spacing: -0.5px; margin-bottom: 32px; }}
                .inner {{ color: #374151; }}
                .inner h2 {{ color: #1f2937; font-size: 20px; margin-bottom: 16px; }}
                .inner p {{ color: #374151; font-size: 15px; margin-bottom: 16px; }}
                .button {{ display: inline-block; padding: 14px 32px; background: #ea580c; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; margin: 24px 0; }}
                .link-box {{ background: #f9fafb; padding: 12px 16px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #6b7280; border: 1px solid #e5e7eb; }}
                .footer {{ text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }}
                .footer p {{ color: #9ca3af; font-size: 13px; margin: 4px 0; }}
            </style>
        </head>
        <body style="background-color: #f9fafb; margin: 0; padding: 0;">
            <div class="container">
                <div class="card">
                    <div class="logo">EduBid</div>
                    <div class="inner">
                        <h2>Verifica tu correo electrónico</h2>
                        <p>Hola {user.first_name},</p>
                        <p>Gracias por registrarte en Educoin. Para completar tu registro, necesitamos verificar tu correo electrónico.</p>
                        <p>Por favor, haz clic en el siguiente botón:</p>
                        <div style="text-align: center;">
                            <a href="{verification_link}" class="button">Verificar mi correo</a>
                        </div>
                        <p>O copia y pega este enlace en tu navegador:</p>
                        <div class="link-box">{verification_link}</div>
                        <p style="font-size: 13px; color: #6b7280;"><strong>Este enlace expirará en 24 horas.</strong></p>
                        <p style="font-size: 13px; color: #6b7280;">Si no te registraste en Educoin, puedes ignorar este correo.</p>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no respondas.</p>
                        <p>© 2025 Educoin</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = strip_tags(html_content)
        msg = EmailMultiAlternatives(
            subject,
            text_content,
            settings.DEFAULT_FROM_EMAIL,
            [user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        
        logger.info("EMAIL ENVIADO EXITOSAMENTE")
        return True
        
    except Exception as e:
        logger.error(f"ERROR SMTP: {str(e)}")
        return False


def send_welcome_email_api(user, is_google_signup=False):
    """Envía email de bienvenida usando el SMTP de Django"""
    try:
        logger.info("INICIANDO ENVÍO DE BIENVENIDA VÍA GMAIL SMTP")
        
        dashboard_link = f"{settings.FRONTEND_URL}/dashboard"
        signup_method = "Google" if is_google_signup else "registro manual"
        subject = '🎊 ¡Tu cuenta está lista! - Educoin'
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
                .card {{ background: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }}
                .logo {{ font-size: 22px; font-weight: 700; color: #ea580c; text-align: center; letter-spacing: -0.5px; margin-bottom: 32px; }}
                .inner {{ color: #374151; }}
                .inner h2 {{ color: #1f2937; font-size: 20px; margin-bottom: 16px; }}
                .inner h3 {{ color: #1f2937; font-size: 17px; margin-bottom: 12px; }}
                .inner p {{ color: #374151; font-size: 15px; margin-bottom: 16px; }}
                .feature-box {{ background: #f9fafb; padding: 16px; margin: 12px 0; border-radius: 6px; border: 1px solid #e5e7eb; }}
                .feature-box strong {{ color: #1f2937; font-size: 15px; }}
                .feature-box p {{ color: #6b7280; font-size: 14px; margin: 4px 0 0 0; }}
                .button {{ display: inline-block; padding: 14px 32px; background: #ea580c; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; margin: 24px 0; }}
                .footer {{ text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }}
                .footer p {{ color: #9ca3af; font-size: 13px; margin: 4px 0; }}
            </style>
        </head>
        <body style="background-color: #f9fafb; margin: 0; padding: 0;">
            <div class="container">
                <div class="card">
                    <div class="logo">EduBid</div>
                    <div class="inner">
                        <h2>¡Cuenta activada!</h2>
                        <p>Hola {user.first_name},</p>
                        <p>Tu cuenta en Educoin ha sido creada exitosamente mediante {signup_method}.</p>
                        <h3>¿Qué puedes hacer ahora?</h3>
                        <div class="feature-box">
                            <strong>Gana Educoins</strong>
                            <p>Completa actividades y obtén recompensas por tu aprendizaje.</p>
                        </div>
                        <div class="feature-box">
                            <strong>Únete a Grupos</strong>
                            <p>Participa en clases y colabora con otros estudiantes.</p>
                        </div>
                        <div class="feature-box">
                            <strong>Participa en Subastas</strong>
                            <p>Usa tus Educoins para ganar premios exclusivos.</p>
                        </div>
                        <div style="text-align: center;">
                            <a href="{dashboard_link}" class="button">Ir a mi Dashboard</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>© 2025 Educoin</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = strip_tags(html_content)
        msg = EmailMultiAlternatives(
            subject,
            text_content,
            settings.DEFAULT_FROM_EMAIL,
            [user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        return True
        
    except Exception as e:
        logger.error(f"ERROR EN BIENVENIDA SMTP: {str(e)}")
        return False


def send_password_reset_email_api(user, reset_link):
    """Envía email de restablecimiento de contraseña usando el SMTP de Django"""
    try:
        logger.info("INICIANDO ENVÍO DE RESET VÍA GMAIL SMTP")
        logger.info(f"Destinatario: {user.email}")

        subject = '🔐 Restablece tu contraseña - Educoin'

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
                .card {{ background: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }}
                .logo {{ font-size: 22px; font-weight: 700; color: #ea580c; text-align: center; letter-spacing: -0.5px; margin-bottom: 32px; }}
                .inner {{ color: #374151; }}
                .inner h2 {{ color: #1f2937; font-size: 20px; margin-bottom: 16px; }}
                .inner p {{ color: #374151; font-size: 15px; margin-bottom: 16px; }}
                .button {{ display: inline-block; padding: 14px 32px; background: #ea580c; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; margin: 24px 0; }}
                .link-box {{ background: #f9fafb; padding: 12px 16px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #6b7280; border: 1px solid #e5e7eb; }}
                .footer {{ text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }}
                .footer p {{ color: #9ca3af; font-size: 13px; margin: 4px 0; }}
            </style>
        </head>
        <body style="background-color: #f9fafb; margin: 0; padding: 0;">
            <div class="container">
                <div class="card">
                    <div class="logo">EduBid</div>
                    <div class="inner">
                        <h2>Restablece tu contraseña</h2>
                        <p>Hola {user.first_name},</p>
                        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Educoin.</p>
                        <p>Por favor, haz clic en el siguiente botón para crear una nueva contraseña:</p>
                        <div style="text-align: center;">
                            <a href="{reset_link}" class="button">Restablecer contraseña</a>
                        </div>
                        <p>O copia y pega este enlace en tu navegador:</p>
                        <div class="link-box">{reset_link}</div>
                        <p style="font-size: 13px; color: #6b7280;"><strong>Este enlace expirará en 1 hora.</strong></p>
                        <p style="font-size: 13px; color: #6b7280;">Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña permanecerá igual.</p>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no respondas.</p>
                        <p>© 2025 Educoin</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = strip_tags(html_content)
        msg = EmailMultiAlternatives(
            subject,
            text_content,
            settings.DEFAULT_FROM_EMAIL,
            [user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()

        logger.info("EMAIL DE RESET ENVIADO EXITOSAMENTE")
        return True

    except Exception as e:
        logger.error(f"ERROR SMTP RESET: {str(e)}")
        return False


def send_account_deletion_confirmation_email_api(user):
    """Envía email de confirmación de eliminación de cuenta usando el SMTP de Django"""
    try:
        logger.info("INICIANDO ENVÍO DE CONFIRMACIÓN ELIMINACIÓN VÍA GMAIL SMTP")
        logger.info(f"Destinatario: {user.email}")

        subject = '👋 Confirmación de eliminación de cuenta - Educoin'

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
                .card {{ background: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }}
                .logo {{ font-size: 22px; font-weight: 700; color: #ea580c; text-align: center; letter-spacing: -0.5px; margin-bottom: 32px; }}
                .inner {{ color: #374151; }}
                .inner h2 {{ color: #1f2937; font-size: 20px; margin-bottom: 16px; }}
                .inner p {{ color: #374151; font-size: 15px; margin-bottom: 16px; }}
                .footer {{ text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }}
                .footer p {{ color: #9ca3af; font-size: 13px; margin: 4px 0; }}
            </style>
        </head>
        <body style="background-color: #f9fafb; margin: 0; padding: 0;">
            <div class="container">
                <div class="card">
                    <div class="logo">EduBid</div>
                    <div class="inner">
                        <h2>Cuenta eliminada</h2>
                        <p>Hola {user.first_name},</p>
                        <p>Te confirmamos que tu cuenta en Educoin ha sido eliminada exitosamente.</p>
                        <p>Todos tus datos han sido removidos de nuestros sistemas de acuerdo con nuestra política de privacidad.</p>
                        <p>Si cambias de opinión, siempre puedes crear una nueva cuenta en Educoin.</p>
                        <p>Gracias por haber sido parte de nuestra comunidad. Mucho éxito en tu aprendizaje.</p>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no respondas.</p>
                        <p>© 2025 Educoin</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = strip_tags(html_content)
        msg = EmailMultiAlternatives(
            subject,
            text_content,
            settings.DEFAULT_FROM_EMAIL,
            [user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()

        logger.info("EMAIL DE CONFIRMACIÓN ELIMINACIÓN ENVIADO EXITOSAMENTE")
        return True

    except Exception as e:
        logger.error(f"ERROR SMTP CONFIRMACIÓN ELIMINACIÓN: {str(e)}")
        return False

