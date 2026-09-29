from django.test import TestCase
from django.db import IntegrityError, transaction
from rest_framework.test import APIClient
from rest_framework import status

from apps.users.models import User
from apps.institutions.models import Institution


class InstitutionModelAndApiTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="superadmin_inst",
            email="admin_inst@edubid.com",
            password="password123",
            role="admin"
        )
        self.institucion_a = Institution.objects.create(
            nombre="Colegio San Agustín",
            codigo_dane="555001",
            activo=True,
            color_primario="#f97316",
            color_secundario="#3b82f6"
        )
        self.institucion_inactiva = Institution.objects.create(
            nombre="Colegio Inactivo",
            codigo_dane="555002",
            activo=False
        )
        self.rector = User.objects.create_user(
            username="rector_inst_a",
            email="rector_inst_a@edubid.com",
            password="password123",
            role="rector",
            institucion=self.institucion_a
        )
        self.docente = User.objects.create_user(
            username="docente_inst_a",
            email="docente_inst_a@edubid.com",
            password="password123",
            role="docente",
            institucion=self.institucion_a
        )
        self.client = APIClient()

    def test_crear_institucion_valida(self):
        """Verifica la creación del modelo Institution con valores por defecto."""
        inst = Institution.objects.create(
            nombre="Liceo Moderno",
            codigo_dane="555003"
        )
        self.assertEqual(inst.nombre, "Liceo Moderno")
        self.assertTrue(inst.activo)
        self.assertEqual(inst.color_primario, "#f97316")
        self.assertEqual(str(inst), "Liceo Moderno")

    def test_codigo_dane_unico(self):
        """El campo codigo_dane debe ser único."""
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Institution.objects.create(
                    nombre="Otro Colegio",
                    codigo_dane="555001"
                )

    def test_endpoint_publico_instituciones(self):
        """El endpoint público /api/institutions/public/ debe responder sin autenticación y mostrar solo activas."""
        response = self.client.get("/api/institutions/public/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        nombres = [item["nombre"] for item in response.data]
        self.assertIn("Colegio San Agustín", nombres)
        self.assertNotIn("Colegio Inactivo", nombres)

    def test_endpoint_admin_puede_crear_institucion(self):
        """Un usuario con rol 'admin' puede crear nuevas instituciones."""
        self.client.force_authenticate(user=self.admin)
        data = {
            "nombre": "Nueva Escuela del Futuro",
            "codigo_dane": "777888",
            "activo": True
        }
        response = self.client.post("/api/institutions/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Institution.objects.filter(codigo_dane="777888").exists())

    def test_no_admin_no_puede_crear_institucion(self):
        """Usuarios con rol docente o rector no pueden crear instituciones."""
        self.client.force_authenticate(user=self.docente)
        data = {
            "nombre": "Escuela No Autorizada",
            "codigo_dane": "999000"
        }
        response = self.client.post("/api/institutions/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_rector_puede_actualizar_su_institucion_sin_campos_protegidos(self):
        """El rector solo puede actualizar colores o branding de su institución, sin alterar codigo_dane ni activo."""
        self.client.force_authenticate(user=self.rector)
        data = {
            "color_primario": "#10b981",
            "codigo_dane": "HACK_DANE",
            "activo": False
        }
        response = self.client.patch(f"/api/institutions/{self.institucion_a.id}/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.institucion_a.refresh_from_db()
        # El color debe haber cambiado
        self.assertEqual(self.institucion_a.color_primario, "#10b981")
        # El codigo_dane y activo deben permanecer protegidos
        self.assertEqual(self.institucion_a.codigo_dane, "555001")
        self.assertTrue(self.institucion_a.activo)

    def test_rector_puede_exportar_reporte_pdf_institucional(self):
        """El rector puede descargar el informe institucional en PDF."""
        self.client.force_authenticate(user=self.rector)
        response = self.client.get(f"/api/institutions/{self.institucion_a.id}/exportar-pdf/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertTrue(len(response.content) > 100)

    def test_rector_puede_exportar_reporte_excel_institucional(self):
        """El rector puede descargar el informe institucional en Excel (.xlsx)."""
        self.client.force_authenticate(user=self.rector)
        response = self.client.get(f"/api/institutions/{self.institucion_a.id}/exportar-excel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertTrue(len(response.content) > 100)

    def test_rector_no_puede_exportar_reporte_otra_institucion(self):
        """El rector no puede descargar informes de instituciones ajenas."""
        otra_inst = Institution.objects.create(nombre="Colegio Externo", codigo_dane="999888")
        self.client.force_authenticate(user=self.rector)
        response = self.client.get(f"/api/institutions/{otra_inst.id}/exportar-pdf/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


