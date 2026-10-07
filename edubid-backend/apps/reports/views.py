import logging
from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserReportSerializer

logger = logging.getLogger(__name__)


class CreateReportView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = UserReportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        extra_data = {}
        user = request.user if request.user and request.user.is_authenticated else None

        if user:
            extra_data['user'] = user
            if not serializer.validated_data.get('email_contacto') and getattr(user, 'email', None):
                extra_data['email_contacto'] = user.email
            if not serializer.validated_data.get('nombre_contacto'):
                nombre = ''
                if hasattr(user, 'get_full_name'):
                    nombre = user.get_full_name().strip()
                if not nombre and hasattr(user, 'first_name'):
                    nombre = f"{user.first_name} {getattr(user, 'last_name', '')}".strip()
                if not nombre and hasattr(user, 'username'):
                    nombre = user.username
                if nombre:
                    extra_data['nombre_contacto'] = nombre

        reporte = serializer.save(**extra_data)

        # Enviar correo de notificación
        try:
            user_str = reporte.user.email if reporte.user else (reporte.nombre_contacto or "Anónimo")
            email_str = reporte.email_contacto or (reporte.user.email if reporte.user else "No especificado")
            fecha_str = reporte.creado.strftime('%Y-%m-%d %H:%M:%S')

            subject = f"[EduBid Reporte] [{reporte.get_tipo_display()}] {reporte.asunto}"
            body = (
                f"Nuevo reporte recibido en EduBid:\n\n"
                f"ID: #{reporte.id}\n"
                f"Tipo: {reporte.get_tipo_display()}\n"
                f"Asunto: {reporte.asunto}\n"
                f"Usuario: {user_str}\n"
                f"Email de Contacto: {email_str}\n"
                f"Nombre de Contacto: {reporte.nombre_contacto or 'No especificado'}\n"
                f"Página de Origen: {reporte.pagina_origen or 'No especificada'}\n"
                f"Navegador / Info: {reporte.navegador_info or 'No especificado'}\n"
                f"Fecha: {fecha_str}\n\n"
                f"Descripción:\n"
                f"----------------------------------------\n"
                f"{reporte.descripcion}\n"
                f"----------------------------------------\n"
            )

            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=['ivanjmm01@gmail.com'],
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f"Error al enviar correo para el reporte #{reporte.id}: {e}")

        return Response(
            {
                "success": True,
                "message": "Reporte enviado con éxito.",
                "id": reporte.id,
            },
            status=201
        )
