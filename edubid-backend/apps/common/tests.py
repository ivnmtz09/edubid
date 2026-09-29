from django.test import TestCase
from django.db import IntegrityError
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError, PermissionDenied
from rest_framework import status
from edubid_core.exceptions import custom_exception_handler


class CustomExceptionHandlerTests(TestCase):
    """
    Pruebas unitarias para el manejador global de excepciones custom_exception_handler.
    Garantiza que todas las anomalías y errores del backend retornen siempre JSON estructurado
    con la propiedad 'detail' para notificaciones en el frontend.
    """

    def test_drf_validation_error_dict_normalized_with_detail(self):
        """Un dict de errores por campo añade automáticamente un campo 'detail' amigable."""
        exc = DRFValidationError({"email": ["Este correo ya está registrado en el sistema."]})
        context = {"view": None}
        response = custom_exception_handler(exc, context)

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)
        self.assertEqual(response.data["detail"], "email: Este correo ya está registrado en el sistema.")

    def test_drf_validation_error_list_normalized_with_detail(self):
        """Una lista plana de errores de DRF se transforma en dict con campo 'detail'."""
        exc = DRFValidationError(["No se puede procesar la solicitud con estos parámetros."])
        context = {"view": None}
        response = custom_exception_handler(exc, context)

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)
        self.assertEqual(response.data["detail"], "No se puede procesar la solicitud con estos parámetros.")

    def test_drf_permission_denied_preserves_detail(self):
        """PermissionDenied mantiene su código 403 y propiedad detail."""
        exc = PermissionDenied("No tienes permisos suficientes para realizar esta acción.")
        context = {"view": None}
        response = custom_exception_handler(exc, context)

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("detail", response.data)
        self.assertEqual(response.data["detail"], "No tienes permisos suficientes para realizar esta acción.")

    def test_django_integrity_error_handled_as_http_400(self):
        """Un IntegrityError de base de datos se captura como HTTP 400 en lugar de crash 500."""
        exc = IntegrityError("Duplicate entry 'test@edubid.com' for key 'users_user.email'")
        context = {"view": None}
        response = custom_exception_handler(exc, context)

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error_type"], "integrity_error")
        self.assertIn("detail", response.data)

    def test_django_validation_error_handled_as_http_400(self):
        """Un ValidationError de modelo de Django se captura como HTTP 400 con su mensaje."""
        exc = DjangoValidationError("El código de vinculación contiene caracteres no permitidos.")
        context = {"view": None}
        response = custom_exception_handler(exc, context)

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error_type"], "validation_error")
        self.assertEqual(response.data["detail"], "El código de vinculación contiene caracteres no permitidos.")

    def test_unhandled_server_exception_returns_http_500_json(self):
        """Cualquier excepción inesperada de Python retorna JSON HTTP 500 estructurado."""
        exc = RuntimeError("Fallo crítico inesperado en subsistema externo")
        context = {"view": None}
        response = custom_exception_handler(exc, context)

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data["error_type"], "server_error")
        self.assertEqual(
            response.data["detail"],
            "Ocurrió un error inesperado en el servidor. Por favor intenta de nuevo más tarde."
        )
