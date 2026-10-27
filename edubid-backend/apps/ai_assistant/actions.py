"""
Acciones sensibles del asistente de IA con confirmacion humana en el servidor.

El modelo de lenguaje solo PROPONE (propose_action). La ejecucion ocurre unicamente cuando el
usuario autenticado confirma desde la interfaz (confirm_action), de modo que un texto malicioso
dentro de una entrega o del chat no puede mover EduCoins ni notas por si solo.
"""
import logging
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from .models import AIPendingAction
from .tools import dispatch_tool

logger = logging.getLogger(__name__)

CONFIRMATION_REQUIRED = {"grade_submission", "award_educoins"}
PENDING_TTL = timedelta(minutes=10)
MAX_PENDING_PER_USER = 10


def _short(value, limit=120):
    return str(value if value is not None else '').replace('\n', ' ').strip()[:limit]


def describe_action(tool: str, args: dict) -> str:
    if tool == 'award_educoins':
        return (f"Otorgar {_short(args.get('cantidad'), 10)} EduCoins a {_short(args.get('estudiante_identificador'))} "
                f"(grupo {_short(args.get('grupo_id'), 10)}). Motivo: {_short(args.get('motivo'), 150)}")
    if tool == 'grade_submission':
        return (f"Calificar la entrega #{_short(args.get('submission_id'), 10)} con {_short(args.get('calificacion'), 6)}/5.0. "
                f"Retroalimentación: {_short(args.get('retroalimentacion'), 150)}")
    return f"Ejecutar {tool}"


def propose_action(user, tool: str, args: dict) -> dict:
    """Registra la accion como pendiente y devuelve lo que se le informa al modelo."""
    args = args if isinstance(args, dict) else {}
    ahora = timezone.now()
    AIPendingAction.objects.filter(user=user, estado='pending', expira_en__lt=ahora).update(estado='expired')
    if AIPendingAction.objects.filter(user=user, estado='pending').count() >= MAX_PENDING_PER_USER:
        return {"status": "error", "error": "Hay demasiadas acciones pendientes de confirmar. Confirma o cancela las anteriores."}

    action = AIPendingAction.objects.create(
        user=user, tool=tool, arguments=args,
        resumen=describe_action(tool, args),
        expira_en=ahora + PENDING_TTL,
    )
    return {
        "status": "pendiente_confirmacion",
        "accion_id": action.id,
        "resumen": action.resumen,
        "mensaje": ("La acción NO se ha ejecutado. Quedó propuesta y el usuario debe confirmarla con el botón "
                    "'Confirmar' que aparece en la interfaz. Informa al usuario que debe confirmarla o cancelarla."),
    }


def confirm_action(user, action_id: int) -> dict:
    with transaction.atomic():
        try:
            action = AIPendingAction.objects.select_for_update().get(pk=action_id, user=user)
        except AIPendingAction.DoesNotExist:
            return {"http": 404, "error": "Acción no encontrada."}
        if action.estado != 'pending':
            return {"http": 409, "error": f"Esta acción ya no está pendiente ({action.get_estado_display().lower()})."}
        if timezone.now() >= action.expira_en:
            action.estado = 'expired'
            action.save(update_fields=['estado'])
            return {"http": 410, "error": "La acción expiró. Pídele de nuevo al asistente que la proponga."}

        resultado = dispatch_tool(action.tool, action.arguments, user)
        ok = resultado.get('status') == 'success'
        action.estado = 'executed' if ok else 'failed'
        action.resultado = resultado
        action.save(update_fields=['estado', 'resultado'])
        return {"http": 200 if ok else 400, "ok": ok, "resultado": resultado, "accion_id": action.id}


def cancel_action(user, action_id: int) -> dict:
    updated = AIPendingAction.objects.filter(pk=action_id, user=user, estado='pending').update(estado='cancelled')
    if not updated:
        return {"http": 404, "error": "No hay una acción pendiente con ese identificador."}
    return {"http": 200, "ok": True, "accion_id": action_id}
