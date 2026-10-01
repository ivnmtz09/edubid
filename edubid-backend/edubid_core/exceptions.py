import logging
from django.core.exceptions import (
    ValidationError as DjangoValidationError,
    ObjectDoesNotExist,
)
from django.db import IntegrityError
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Manejador global de excepciones para Django REST Framework.
    
    1. Ejecuta el manejador estándar de DRF para capturar excepciones de tipo APIException
       (ValidationError, PermissionDenied, AuthenticationFailed, NotFound, Throttled, etc.).
    2. Si DRF devuelve respuesta, normaliza el cuerpo de error para garantizar que siempre
       exista una propiedad 'detail' limpia y amigable para el frontend y toasts.
    3. Si la excepción no es capturada por DRF:
       - Captura IntegrityError de base de datos (clave duplicada, constraints) y retorna HTTP 400.
       - Captura ValidationError de modelos de Django y retorna HTTP 400.
       - Captura cualquier otra excepción no controlada (500), registra el traceback en logs
         y retorna una respuesta estructurada JSON en lugar de una página HTML estándar.
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Normalizar respuesta para garantizar campo 'detail'
        if isinstance(response.data, list):
            detail_msg = response.data[0] if response.data else "Error en la solicitud."
            response.data = {
                "detail": str(detail_msg),
                "errors": response.data
            }
        elif isinstance(response.data, dict):
            if "detail" not in response.data:
                # Si DRF devolvió un dict de errores por campo (ej. {"nombre": ["Requerido"]})
                first_key = next(iter(response.data))
                first_val = response.data[first_key]
                if isinstance(first_val, list) and len(first_val) > 0:
                    detail_msg = f"{first_key}: {first_val[0]}"
                else:
                    detail_msg = f"{first_key}: {first_val}"
                response.data["detail"] = str(detail_msg)
        return response

    # Manejar excepciones de Django no interceptadas por defecto en DRF
    view_name = context.get('view', None)
    view_name_str = view_name.__class__.__name__ if view_name else "UnknownView"

    if isinstance(exc, IntegrityError):
        logger.warning("IntegrityError en %s: %s", view_name_str, exc)
        return Response(
            {
                "detail": "Conflicto de integridad en la base de datos: el registro ya existe o viola una restricción de datos.",
                "error_type": "integrity_error"
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if isinstance(exc, DjangoValidationError):
        logger.warning("DjangoValidationError en %s: %s", view_name_str, exc)
        detail_msg = exc.message if hasattr(exc, 'message') else str(exc)
        return Response(
            {
                "detail": detail_msg,
                "error_type": "validation_error"
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if isinstance(exc, ObjectDoesNotExist):
        logger.warning("ObjectDoesNotExist en %s: %s", view_name_str, exc)
        # Si ocurre durante validación de tokens o autenticación, retornar 401 para que frontend limpie tokens
        if "token" in view_name_str.lower() or "auth" in view_name_str.lower():
            return Response(
                {
                    "detail": "Token no válido o usuario no encontrado.",
                    "code": "token_not_valid",
                    "error_type": "authentication_error"
                },
                status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(
            {
                "detail": "El recurso solicitado no fue encontrado.",
                "error_type": "not_found"
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # Excepción crítica no controlada (HTTP 500)
    logger.error(
        "Excepción crítica no controlada en %s: %s",
        view_name_str,
        exc,
        exc_info=True
    )
    return Response(
        {
            "detail": "Ocurrió un error inesperado en el servidor. Por favor intenta de nuevo más tarde.",
            "error_type": "server_error"
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
