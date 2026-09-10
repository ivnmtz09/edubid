from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.users.models import User
from apps.institutions.models import Institution
from apps.classrooms.models import Classroom


class ClassroomApiAndMultiTenantTests(TestCase):
    def setUp(self):
        self.institucion_a = Institution.objects.create(
            nombre="Colegio San Gabriel",
            codigo_dane="600001"
        )
        self.institucion_b = Institution.objects.create(
            nombre="Colegio Bolivariano",
            codigo_dane="600002"
        )

        self.admin = User.objects.create_user(
            username="admin_global",
            email="admin_global@edubid.com",
            password="password123",
            role="admin"
        )

        self.rector_a = User.objects.create_user(
            username="rector_a",
            email="rector_a@edubid.com",
            password="password123",
            role="rector",
            institucion=self.institucion_a
        )

        self.docente_a = User.objects.create_user(
            username="docente_a",
            email="docente_a@edubid.com",
            password="password123",
            role="docente",
            institucion=self.institucion_a
        )

        self.docente_b = User.objects.create_user(
            username="docente_b",
            email="docente_b@edubid.com",
            password="password123",
            role="docente",
            institucion=self.institucion_b
        )

        self.estudiante_a = User.objects.create_user(
            username="estudiante_a",
            email="estudiante_a@edubid.com",
            password="password123",
            role="estudiante",
            institucion=self.institucion_a
        )

        self.classroom_a = Classroom.objects.create(
            nombre="Matemáticas Avanzadas",
            descripcion="Curso de cálculo y álgebra lineal",
            docente=self.docente_a
        )

        self.classroom_b = Classroom.objects.create(
            nombre="Historia Universal",
            descripcion="Historia moderna y contemporánea",
            docente=self.docente_b
        )

        self.client = APIClient()

    def test_docente_puede_crear_classroom(self):
        """Un docente autenticado puede crear un aula vía API."""
        self.client.force_authenticate(user=self.docente_a)
        data = {
            "nombre": "Biología Marina",
            "descripcion": "Ecosistemas acuáticos"
        }
        response = self.client.post("/api/classrooms/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["nombre"], "Biología Marina")
        self.assertEqual(response.data["docente"], self.docente_a.id)

    def test_estudiante_no_puede_crear_classroom(self):
        """Un estudiante no tiene permisos (IsDocente) para crear aulas."""
        self.client.force_authenticate(user=self.estudiante_a)
        data = {
            "nombre": "Aula No Autorizada",
            "descripcion": "Intento de estudiante"
        }
        response = self.client.post("/api/classrooms/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_docente_solo_ve_sus_propias_aulas(self):
        """Un docente solo puede listar las aulas que él mismo imparte."""
        self.client.force_authenticate(user=self.docente_a)
        response = self.client.get("/api/classrooms/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        nombres = [c["nombre"] for c in response.data]
        self.assertIn("Matemáticas Avanzadas", nombres)
        self.assertNotIn("Historia Universal", nombres)

    def test_rector_ve_aulas_de_su_institucion_y_no_de_otras(self):
        """El rector solo ve las aulas dictadas por docentes de su misma institución."""
        self.client.force_authenticate(user=self.rector_a)
        response = self.client.get("/api/classrooms/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        nombres = [c["nombre"] for c in response.data]
        # docente_a está en institucion_a -> rector_a debe verla
        self.assertIn("Matemáticas Avanzadas", nombres)
        # docente_b está en institucion_b -> rector_a NO debe verla
        self.assertNotIn("Historia Universal", nombres)

    def test_admin_global_ve_todas_las_aulas(self):
        """El administrador global puede ver todas las aulas de todas las instituciones."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/classrooms/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        nombres = [c["nombre"] for c in response.data]
        self.assertIn("Matemáticas Avanzadas", nombres)
        self.assertIn("Historia Universal", nombres)
