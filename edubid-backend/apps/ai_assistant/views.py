import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .services import send_chat_completion

logger = logging.getLogger(__name__)

ALLOWED_ROLES = {'docente', 'coordinador', 'rector', 'admin'}


class ChatAiView(APIView):
    """
    Endpoint principal para conversar con EDUBID IA.
    Disponible para Docentes, Coordinadores, Rectores y Administradores.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        role = getattr(user, 'role', None)

        if role not in ALLOWED_ROLES and not user.is_superuser:
            return Response(
                {
                    "error": "Permiso denegado",
                    "detail": "EDUBID IA está disponible exclusivamente para personal docente, coordinación y rectoría."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        messages = request.data.get('messages', [])
        if not messages or not isinstance(messages, list):
            return Response(
                {"error": "Formato inválido", "detail": "El campo 'messages' debe ser una lista de mensajes."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validación básica de mensajes
        last_message = messages[-1]
        if not isinstance(last_message, dict) or not last_message.get('content', '').strip():
            return Response(
                {"error": "Mensaje vacío", "detail": "El último mensaje no puede estar vacío."},
                status=status.HTTP_400_BAD_REQUEST
            )

        context = request.data.get('context', None)

        try:
            result = send_chat_completion(messages=messages, user=user, context=context)
            return Response({
                "status": "success",
                "role": "assistant",
                "content": result["content"],
                "model": result.get("model", ""),
                "author": "EDUBID IA"
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
                {"error": "Configuración requerida", "detail": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error("Error al procesar consulta con EDUBID IA: %s", str(e), exc_info=True)
            return Response(
                {"error": "Error del servicio de IA", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AiSuggestionsView(APIView):
    """
    Retorna sugerencias de prompts rápidos según el rol del usuario conectado.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(request.user, 'role', 'docente')

        suggestions_by_role = {
            'docente': [
                "Genera una rúbrica de 4 niveles para evaluar una exposición de ciencias.",
                "Sugiéreme 3 ideas de recompensas para subastas de EduCoins en mi clase.",
                "Crea un taller de 5 preguntas reflexivas sobre comprensión lectora.",
                "¿Cómo puedo motivar a estudiantes con bajo rendimiento académico?",
            ],
            'coordinador': [
                "Redacta una guía para el acompañamiento y retroalimentación pedagógica en aula.",
                "Estrategias para mediar un conflicto de convivencia escolar entre estudiantes.",
                "Estructura para una reunión de comité de evaluación y promoción.",
                "¿Cómo optimizar el seguimiento a los planes de mejoramiento de área?",
            ],
            'rector': [
                "Estrategias para fortalecer el clima escolar y la motivación docente este período.",
                "Estructura de un informe ejecutivo sobre indicadores de rendimiento académico.",
                "Ideas para articular las subastas y gamificación de EduBid en el PEI.",
                "Recomendaciones para liderar una jornada pedagógica institucional efectiva.",
            ],
            'admin': [
                "¿Cuáles son las buenas prácticas para configurar las instituciones en EduBid?",
                "Recomendaciones de seguridad y gestión de roles en la plataforma.",
            ]
        }

        return Response({
            "role": role,
            "suggestions": suggestions_by_role.get(role, suggestions_by_role['docente'])
        })
