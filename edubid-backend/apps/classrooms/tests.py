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

    def test_paginacion_dinamica_y_retrocompatibilidad(self):
        """
        Verifica que:
        1. Sin parámetros, la API devuelve una lista plana completa (retrocompatibilidad).
        2. Con ?page=1&page_size=1, la API devuelve la estructura paginada con metadatos.
        """
        self.client.force_authenticate(user=self.admin)

        # 1. Petición sin parámetros -> Lista plana
        res_unpaginated = self.client.get("/api/classrooms/")
        self.assertEqual(res_unpaginated.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res_unpaginated.data, list)
        self.assertEqual(len(res_unpaginated.data), 2)

        # 2. Petición con paginación -> Diccionario con metadatos
        res_paginated = self.client.get("/api/classrooms/?page=1&page_size=1")
        self.assertEqual(res_paginated.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res_paginated.data, dict)
        self.assertEqual(res_paginated.data["count"], 2)
        self.assertEqual(res_paginated.data["total_pages"], 2)
        self.assertEqual(res_paginated.data["current_page"], 1)
        self.assertEqual(res_paginated.data["page_size"], 1)
        self.assertIsNotNone(res_paginated.data["next"])
        self.assertIsNone(res_paginated.data["previous"])
        self.assertEqual(len(res_paginated.data["results"]), 1)

        # 3. Petición a la página 2
        res_page_2 = self.client.get("/api/classrooms/?page=2&page_size=1")
        self.assertEqual(res_page_2.status_code, status.HTTP_200_OK)
        self.assertEqual(res_page_2.data["current_page"], 2)
        self.assertIsNone(res_page_2.data["next"])
        self.assertIsNotNone(res_page_2.data["previous"])

    def test_optimizacion_orm_consultas_acotadas(self):
        """
        Verifica que select_related y prefetch_related acotan el número de consultas SQL
        al listar aulas con docentes, grupos y conteo de alumnos.
        """
        from apps.groups.models import Group

        # Crear grupos adicionales en el aula del docente
        for i in range(3):
            grupo = Group.objects.create(
                nombre=f"Grupo P-{i}",
                classroom=self.classroom_a,
                codigo=f"GP00{i}"
            )
            grupo.estudiantes.add(self.estudiante_a)

        self.client.force_authenticate(user=self.docente_a)

        # Con select_related y prefetch_related, listar el aula con sus 3 grupos
        # y estudiantes se resuelve en solo 3 consultas SQL (sin N+1)
        with self.assertNumQueries(3):
            # 1: Classroom + docente + institucion select_related
            # 2: grupos_clases prefetch
            # 3: estudiantes prefetch
            response = self.client.get("/api/classrooms/")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(len(response.data), 1)
            self.assertEqual(response.data[0]["estudiantes_count"], 3)

