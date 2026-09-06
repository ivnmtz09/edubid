from django.test import TestCase
from rest_framework.test import APIClient
from apps.users.models import User
from apps.institutions.models import Institution
from apps.classrooms.models import Classroom
from apps.groups.models import Group
from apps.tokens.models import Wallet, Period


class GroupEnrollmentAndRBACTests(TestCase):
    def setUp(self):
        self.institucion_1 = Institution.objects.create(
            nombre="Institución Grupos 1",
            codigo_dane="556677"
        )
        self.institucion_2 = Institution.objects.create(
            nombre="Institución Grupos 2",
            codigo_dane="889900"
        )

        self.rector = User.objects.create_user(
            username="rector_groups",
            email="rector_groups@edubid.com",
            password="password123",
            role="rector",
            institucion=self.institucion_1
        )
        self.docente_1 = User.objects.create_user(
            username="docente_g1",
            email="docente_g1@edubid.com",
            password="password123",
            role="docente",
            institucion=self.institucion_1
        )
        self.docente_2 = User.objects.create_user(
            username="docente_g2",
            email="docente_g2@edubid.com",
            password="password123",
            role="docente",
            institucion=self.institucion_2
        )
        self.estudiante = User.objects.create_user(
            username="estudiante_g",
            email="estudiante_g@edubid.com",
            password="password123",
            role="estudiante",
            institucion=self.institucion_1
        )

        self.classroom_1 = Classroom.objects.create(
            nombre="Matemáticas Avanzadas",
            docente=self.docente_1
        )
        self.classroom_2 = Classroom.objects.create(
            nombre="Historia Universal",
            docente=self.docente_2
        )

        self.group_1 = Group.objects.create(
            nombre="Grupo M-101",
            classroom=self.classroom_1
        )
        self.group_2 = Group.objects.create(
            nombre="Grupo H-201",
            classroom=self.classroom_2
        )

    def test_group_code_auto_generation(self):
        """Al crear un grupo se autogenera un código único alfanumérico de 6 caracteres."""
        self.assertIsNotNone(self.group_1.codigo)
        self.assertEqual(len(self.group_1.codigo), 6)
        self.assertTrue(self.group_1.codigo.isupper())
        self.assertIsNotNone(self.group_1.codigo_expira_en)

    def test_student_join_group_by_code_creates_wallet(self):
        """Un estudiante se une a un grupo por código y se le aprovisiona su Wallet automáticamente."""
        client = APIClient()
        client.force_authenticate(user=self.estudiante)

        response = client.post("/api/groups/join/", {"code": self.group_1.codigo})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("wallet_creada"))

        # Validar matrícula
        self.assertTrue(self.group_1.estudiantes.filter(id=self.estudiante.id).exists())

        # Validar billetera creada en periodo activo
        periodo_activo = Period.objects.filter(grupo=self.group_1, activo=True).first()
        wallet = Wallet.objects.filter(
            usuario=self.estudiante,
            grupo=self.group_1,
            periodo=periodo_activo
        ).first()

        self.assertIsNotNone(wallet)
        self.assertEqual(wallet.saldo_educoins, 0)
        self.assertEqual(wallet.bloqueado_educoins, 0)

    def test_student_cannot_join_twice(self):
        """Un estudiante que ya está matriculado no puede unirse nuevamente al mismo grupo."""
        self.group_1.estudiantes.add(self.estudiante)

        client = APIClient()
        client.force_authenticate(user=self.estudiante)

        response = client.post("/api/groups/join/", {"code": self.group_1.codigo})
        self.assertEqual(response.status_code, 400)
        self.assertIn("Ya estas en este grupo", response.data.get("detail", ""))

    def test_docente_cannot_join_group_as_student(self):
        """Un usuario con rol docente no puede usar el endpoint de unión de estudiantes."""
        client = APIClient()
        client.force_authenticate(user=self.docente_1)

        response = client.post("/api/groups/join/", {"code": self.group_1.codigo})
        self.assertEqual(response.status_code, 403)
        self.assertIn("Solo los estudiantes pueden unirse", response.data.get("detail", ""))

    def test_join_with_invalid_code_fails(self):
        """Un código inexistente retorna error 400."""
        client = APIClient()
        client.force_authenticate(user=self.estudiante)

        response = client.post("/api/groups/join/", {"code": "INVAL9"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("Codigo invalido o expirado", str(response.data))

    def test_group_rbac_isolation(self):
        """
        Aislamiento multi-tenant:
        - Docente 1 solo ve los grupos de sus clases.
        - Rector ve los grupos de su institución.
        - Estudiante solo ve los grupos a los que pertenece.
        """
        client = APIClient()

        # Docente 1: solo debe ver group_1
        client.force_authenticate(user=self.docente_1)
        resp_d1 = client.get("/api/groups/")
        data_d1 = resp_d1.data if isinstance(resp_d1.data, list) else resp_d1.data.get("results", [])
        ids_d1 = [g["id"] for g in data_d1]
        self.assertIn(self.group_1.id, ids_d1)
        self.assertNotIn(self.group_2.id, ids_d1)

        # Rector Institución 1: solo debe ver group_1
        client.force_authenticate(user=self.rector)
        resp_rector = client.get("/api/groups/")
        data_rector = resp_rector.data if isinstance(resp_rector.data, list) else resp_rector.data.get("results", [])
        ids_rector = [g["id"] for g in data_rector]
        self.assertIn(self.group_1.id, ids_rector)
        self.assertNotIn(self.group_2.id, ids_rector)

        # Estudiante: no ha ingresado a ninguno aún
        client.force_authenticate(user=self.estudiante)
        resp_est = client.get("/api/groups/")
        data_est = resp_est.data if isinstance(resp_est.data, list) else resp_est.data.get("results", [])
        ids_est = [g["id"] for g in data_est]
        self.assertNotIn(self.group_1.id, ids_est)

        # Al matricularse en group_1, ahora lo ve
        self.group_1.estudiantes.add(self.estudiante)
        resp_est_after = client.get("/api/groups/")
        data_est_after = resp_est_after.data if isinstance(resp_est_after.data, list) else resp_est_after.data.get("results", [])
        ids_est_after = [g["id"] for g in data_est_after]
        self.assertIn(self.group_1.id, ids_est_after)
