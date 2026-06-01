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
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f97316 0%, #ff8c1a 100%); 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 15px 30px; background: #f97316; 
                          color: white; text-decoration: none; border-radius: 8px; 
                          font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>¡Bienvenido a Educoin! 🎉</h1>
                </div>
                <div class="content">
                    <h2>Hola {user.first_name},</h2>
                    <p>Gracias por registrarte en Educoin. Para completar tu registro, 
                       necesitamos verificar tu correo electrónico.</p>
                    
                    <p>Por favor, haz clic en el siguiente botón para verificar tu cuenta:</p>
                    
                    <div style="text-align: center;">
                        <a href="{verification_link}" class="button">
                            Verificar mi correo
                        </a>
                    </div>
                    
                    <p>O copia y pega este enlace en tu navegador:</p>
                    <p style="background: white; padding: 10px; border-radius: 5px; 
                       word-break: break-all; font-size: 12px;">
                        {verification_link}
                    </p>
                    
                    <p><strong>Este enlace expirará en 24 horas.</strong></p>
                    
                    <p>Si no te registraste en Educoin, puedes ignorar este correo.</p>
                </div>
                <div class="footer">
                    <p>Este es un correo automático, por favor no respondas.</p>
                    <p>© 2025 Educoin - Aprende. Gana. Evoluciona.</p>
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
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f97316 0%, #ff8c1a 100%); 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 15px 30px; background: #f97316; 
                          color: white; text-decoration: none; border-radius: 8px; 
                          font-weight: bold; margin: 20px 0; }}
                .feature-box {{ background: white; padding: 15px; margin: 10px 0; 
                               border-left: 4px solid #f97316; border-radius: 5px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>¡Cuenta Activada! 🎊</h1>
                </div>
                <div class="content">
                    <h2>¡Hola {user.first_name}!</h2>
                    <p>Tu cuenta en Educoin ha sido creada exitosamente mediante {signup_method}.</p>
                    
                    <h3>¿Qué puedes hacer ahora?</h3>
                    
                    <div class="feature-box">
                        <strong>💰 Gana Educoins</strong>
                        <p>Completa actividades y obtén recompensas por tu aprendizaje.</p>
                    </div>
                    
                    <div class="feature-box">
                        <strong>🎯 Únete a Grupos</strong>
                        <p>Participa en clases y colabora con otros estudiantes.</p>
                    </div>
                    
                    <div class="feature-box">
                        <strong>🏆 Participa en Subastas</strong>
                        <p>Usa tus Educoins para ganar premios exclusivos.</p>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="{dashboard_link}" class="button">
                            Ir a mi Dashboard
                        </a>
                    </div>
                </div>
                <div class="footer">
                    <p>© 2025 Educoin - Aprende. Gana. Evoluciona.</p>
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
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f97316 0%, #ff8c1a 100%); 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 15px 30px; background: #f97316; 
                          color: white; text-decoration: none; border-radius: 8px; 
                          font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Restablece tu contraseña 🔐</h1>
                </div>
                <div class="content">
                    <h2>Hola {user.first_name},</h2>
                    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Educoin.</p>
                    
                    <p>Por favor, haz clic en el siguiente botón para crear una nueva contraseña:</p>
                    
                    <div style="text-align: center;">
                        <a href="{reset_link}" class="button">
                            Restablecer contraseña
                        </a>
                    </div>
                    
                    <p>O copia y pega este enlace en tu navegador:</p>
                    <p style="background: white; padding: 10px; border-radius: 5px; 
                       word-break: break-all; font-size: 12px;">
                        {reset_link}
                    </p>
                    
                    <p><strong>Este enlace expirará en 1 hora.</strong></p>
                    
                    <p>Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña permanecerá igual.</p>
                </div>
                <div class="footer">
                    <p>Este es un correo automático, por favor no respondas.</p>
                    <p>© 2025 Educoin - Aprende. Gana. Evoluciona.</p>
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
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%); 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Tu cuenta ha sido eliminada 👋</h1>
                </div>
                <div class="content">
                    <h2>Hola {user.first_name},</h2>
                    <p>Te confirmamos que tu cuenta en Educoin ha sido eliminada exitosamente.</p>
                    
                    <p>Todos tus datos han sido removidos de nuestros sistemas de acuerdo con nuestra política de privacidad.</p>
                    
                    <p>Si cambias de opinión, siempre puedes crear una nueva cuenta en Educoin.</p>
                    
                    <p>Gracias por haber sido parte de nuestra comunidad. ¡Éxitos en tu aprendizaje!</p>
                </div>
                <div class="footer">
                    <p>Este es un correo automático, por favor no respondas.</p>
                    <p>© 2025 Educoin - Aprende. Gana. Evoluciona.</p>
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

