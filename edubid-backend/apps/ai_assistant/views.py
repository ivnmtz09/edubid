import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from rest_framework.throttling import UserRateThrottle

from .services import send_chat_completion
from .actions import confirm_action, cancel_action

logger = logging.getLogger(__name__)

ALLOWED_ROLES = {'docente', 'coordinador', 'rector', 'admin'}
MAX_MESSAGE_CHARS = 4000
MAX_CONTEXT_CHARS = 2000
MAX_MESSAGES = 20


class AiChatRateThrottle(UserRateThrottle):
    """Limite propio del chat: cada mensaje consume cuota del proveedor de IA."""
    scope = 'ai_chat'



class ChatAiView(APIView):
    """
    Endpoint principal para conversar con EDUBID IA.
    Disponible para Docentes, Coordinadores, Rectores y Administradores.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [AiChatRateThrottle]

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

        raw_messages = request.data.get('messages', [])
        if not raw_messages or not isinstance(raw_messages, list):
            return Response(
                {"error": "Formato inválido", "detail": "El campo 'messages' debe ser una lista de mensajes."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Solo roles user/assistant y texto acotado: evita abusar de la cuota del proveedor de IA
        messages = []
        for m in raw_messages[-MAX_MESSAGES:]:
            if isinstance(m, dict) and m.get('role') in ('user', 'assistant') and isinstance(m.get('content'), str):
                messages.append({"role": m['role'], "content": m['content'][:MAX_MESSAGE_CHARS]})

        if not messages or messages[-1]['role'] != 'user' or not messages[-1]['content'].strip():
            return Response(
                {"error": "Mensaje vacío", "detail": "El último mensaje debe ser del usuario y no puede estar vacío."},
                status=status.HTTP_400_BAD_REQUEST
            )

        context = request.data.get('context', None)
        context = context[:MAX_CONTEXT_CHARS] if isinstance(context, str) else None

        try:
            result = send_chat_completion(messages=messages, user=user, context=context)
            return Response({
                "status": "success",
                "role": "assistant",
                "content": result["content"],
                "model": result.get("model", ""),
                "executed_tools": result.get("executed_tools", []),
                "pending_actions": result.get("pending_actions", []),
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
                {"error": "Error del servicio de IA", "detail": "No se pudo obtener respuesta de EDUBID IA. Intenta de nuevo."},
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
                "¿Qué asignaturas y grupos tengo actualmente registrados a mi cargo?",
                "¿Qué estudiantes tengo en mis grupos y qué saldo de EduCoins tienen?",
                "¿Qué actividades tengo activas y cuáles tienen entregas pendientes por calificar?",
                "Ayúdame a redactar las instrucciones y rúbrica para una tarea sobre pensamiento computacional.",
                "Dame 3 ideas pedagógicas de recompensas para motivar la participación con EduCoins.",
                "¿Cómo puedo estructurar una retroalimentación formativa para estudiantes con bajo rendimiento?",
            ],
            'coordinador': [
                "Dame un resumen consolidado de los grupos, docentes y aulas de la institución.",
                "¿Cuáles asignaturas tienen mayor cantidad de actividades en curso?",
                "Redacta una guía para el acompañamiento y retroalimentación pedagógica en aula.",
                "Estrategias para mediar un conflicto de convivencia escolar entre estudiantes.",
            ],
            'rector': [
                "Genera el informe ejecutivo consolidado de la institución en EduBid.",
                "¿Cuántos estudiantes y docentes activos tenemos en la plataforma?",
                "Estrategias para fortalecer el clima escolar y la motivación docente este período.",
                "Recomendaciones para articular la economía de EduCoins en el PEI.",
            ],
            'admin': [
                "Dame un resumen general del estado y actividad de la plataforma.",
                "¿Cuáles son las buenas prácticas para configurar las instituciones en EduBid?",
            ]
        }

        return Response({
            "role": role,
            "suggestions": suggestions_by_role.get(role, suggestions_by_role['docente'])
        })


class AiActionConfirmView(APIView):
    """Confirma y ejecuta una accion sensible que el asistente dejo pendiente."""
    permission_classes = [IsAuthenticated]

    def post(self, request, action_id):
        res = confirm_action(request.user, action_id)
        code = res.pop("http")
        return Response(res, status=code)


class AiActionCancelView(APIView):
    """Cancela una accion pendiente."""
    permission_classes = [IsAuthenticated]

    def post(self, request, action_id):
        res = cancel_action(request.user, action_id)
        code = res.pop("http")
        return Response(res, status=code)
