from datetime import timedelta
from decimal import Decimal
from django.test import TestCase
from django.db import IntegrityError, transaction
from django.utils import timezone
from apps.users.models import User
from apps.institutions.models import Institution
from apps.classrooms.models import Classroom
from apps.groups.models import Group
from apps.activities.models import Activity
from apps.tokens.models import Wallet, Period, CoinTransaction
from apps.grades.models import Grade


class GradeCalculationAndRewardTests(TestCase):
    def setUp(self):
        self.institucion = Institution.objects.create(
            nombre="Institución Grades",
            codigo_dane="443322"
        )
        self.docente = User.objects.create_user(
            username="docente_grades",
            email="docente_grades@edubid.com",
            password="password123",
            role="docente",
            institucion=self.institucion
        )
        self.estudiante = User.objects.create_user(
            username="estudiante_grades",
            email="estudiante_grades@edubid.com",
            password="password123",
            role="estudiante",
            institucion=self.institucion
        )
        self.classroom = Classroom.objects.create(
            nombre="Cálculo Diferencial",
            docente=self.docente
        )
        self.group = Group.objects.create(
            nombre="Grupo C-1",
            classroom=self.classroom
        )
        self.periodo_activo = Period.objects.filter(grupo=self.group, activo=True).first()

        self.activity = Activity.objects.create(
            group=self.group,
            nombre="Taller de Derivadas",
            descripcion="Resolver ejercicios 1 al 10",
            tipo="taller",
            valor_educoins=60,
            puntos_experiencia=100,
            fecha_entrega=timezone.now() + timedelta(days=7)
        )

    def test_calcular_coins_proporcional_sin_bonus(self):
        """Una nota inferior al 90% calcula los EduCoins proporcionalmente sin bonus."""
        grade = Grade(
            activity=self.activity,
            student=self.estudiante,
            nota=Decimal("50.00")
        )
        # 50% de 60 EduCoins = 30 EduCoins
        coins = grade.calcular_coins_ganados()
        self.assertEqual(coins, 30)

    def test_calcular_coins_con_bonus_excelencia(self):
        """Una nota mayor o igual al 90% añade un 10% adicional de bonus."""
        grade = Grade(
            activity=self.activity,
            student=self.estudiante,
            nota=Decimal("100.00")
        )
        # 100% de 60 = 60 coins base + 10% bonus (6) = 66 EduCoins
        coins = grade.calcular_coins_ganados()
        self.assertEqual(coins, 66)

    def test_grade_creation_triggers_automatic_wallet_deposit(self):
        """Al guardar una calificación, la señal post_save deposita los coins en la wallet activa."""
        wallet = Wallet.objects.create(
            usuario=self.estudiante,
            grupo=self.group,
            periodo=self.periodo_activo,
            saldo_educoins=0,
            bloqueado_educoins=0
        )

        grade = Grade.objects.create(
            activity=self.activity,
            student=self.estudiante,
            nota=Decimal("100.00"),
            retroalimentacion="¡Excelente trabajo!"
        )

        wallet.refresh_from_db()
        # 100% de 60 = 60 + 6 bonus = 66 EduCoins
        self.assertEqual(wallet.saldo_educoins, 66)

        # Verificar transacción en libro de transacciones
        tx = CoinTransaction.objects.filter(wallet=wallet, tipo="earn").first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.cantidad_educoins, 66)
        self.assertIn("Taller de Derivadas", tx.descripcion)

    def test_grade_unique_together_per_student_and_activity(self):
        """No se puede calificar dos veces al mismo estudiante en la misma actividad."""
        Grade.objects.create(
            activity=self.activity,
            student=self.estudiante,
            nota=Decimal("80.00")
        )

        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Grade.objects.create(
                    activity=self.activity,
                    student=self.estudiante,
                    nota=Decimal("90.00")
                )

    def test_grade_without_wallet_handles_gracefully(self):
        """Si el estudiante aún no tiene wallet, aplicar_recompensa no debe fallar con error no controlado."""
        grade = Grade.objects.create(
            activity=self.activity,
            student=self.estudiante,
            nota=Decimal("70.00")
        )
        # Debe crearse la calificación aunque no haya wallet
        self.assertIsNotNone(grade.id)

    def test_export_group_report_excel(self):
        """Docente puede exportar reporte consolidado de grupo en formato Excel (.xlsx)."""
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.docente)

        # Vincular estudiante al grupo
        self.group.estudiantes.add(self.estudiante)

        response = client.get(f"/api/grades/grupo/{self.group.id}/exportar-excel/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertTrue(len(response.content) > 100)

    def test_export_group_report_pdf(self):
        """Docente puede exportar reporte consolidado de grupo en formato PDF."""
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.docente)

        self.group.estudiantes.add(self.estudiante)

        response = client.get(f"/api/grades/grupo/{self.group.id}/exportar-pdf/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertTrue(len(response.content) > 100)


class GradeAccessControlSecurityTestCase(TestCase):
    """
    Pruebas de seguridad y control de acceso en GradeViewSet.
    """
    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()

        # Institución A
        self.inst_a = Institution.objects.create(nombre="Instituto A", codigo_dane="111")
        self.rector_a = User.objects.create_user(
            username="rector_ga", email="rector_ga@edubid.com", password="password123",
            role="rector", institucion=self.inst_a
        )
        self.docente_a = User.objects.create_user(
            username="docente_ga", email="docente_ga@edubid.com", password="password123",
            role="docente", institucion=self.inst_a
        )
        self.estudiante_a = User.objects.create_user(
            username="estudiante_ga", email="estudiante_ga@edubid.com", password="password123",
            role="estudiante", institucion=self.inst_a
        )
        self.classroom_a = Classroom.objects.create(nombre="Química Orgánica", docente=self.docente_a)
        self.group_a = Group.objects.create(nombre="Grupo Q-1", classroom=self.classroom_a)
        self.group_a.estudiantes.add(self.estudiante_a)
        Period.crear_periodos_para_grupo(self.group_a)

        self.activity_a = Activity.objects.create(
            group=self.group_a, nombre="Informe Enlace Covalente", tipo="taller", valor_educoins=50,
            fecha_entrega=timezone.now() + timedelta(days=7)
        )

        # Institución B
        self.inst_b = Institution.objects.create(nombre="Instituto B", codigo_dane="222")
        self.rector_b = User.objects.create_user(
            username="rector_gb", email="rector_gb@edubid.com", password="password123",
            role="rector", institucion=self.inst_b
        )
        self.docente_b = User.objects.create_user(
            username="docente_gb", email="docente_gb@edubid.com", password="password123",
            role="docente", institucion=self.inst_b
        )

    def test_cross_teacher_cannot_create_grade(self):
        """Docente B no puede calificar una actividad de la clase de Docente A."""
        self.client.force_authenticate(user=self.docente_b)
        payload = {
            "activity": self.activity_a.id,
            "student": self.estudiante_a.id,
            "nota": 90,
            "retroalimentacion": "Intento de calificación no autorizada"
        }
        res = self.client.post("/api/grades/", payload, format="json")
        self.assertEqual(res.status_code, 403)

    def test_cross_school_rector_cannot_access_group_report(self):
        """Rector de Institución B no puede consultar el reporte de notas de un grupo de Institución A."""
        self.client.force_authenticate(user=self.rector_b)
        res = self.client.get(f"/api/grades/grupo/{self.group_a.id}/reporte/")
        self.assertEqual(res.status_code, 403)

    def test_student_cannot_create_grade(self):
        """Un estudiante no tiene permisos para crear calificaciones."""
        self.client.force_authenticate(user=self.estudiante_a)
        payload = {
            "activity": self.activity_a.id,
            "student": self.estudiante_a.id,
            "nota": 100
        }
        res = self.client.post("/api/grades/", payload, format="json")
        self.assertEqual(res.status_code, 403)




class BulkGradingAndPeriodTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        self.inst = Institution.objects.create(nombre="Colegio B", codigo_dane="661122")
        self.docente = User.objects.create_user(username="b_doc", email="b_doc@edubid.com", password="x", role="docente", institucion=self.inst)
        self.e1 = User.objects.create_user(username="b_e1", email="b_e1@edubid.com", password="x", role="estudiante", institucion=self.inst)
        self.e2 = User.objects.create_user(username="b_e2", email="b_e2@edubid.com", password="x", role="estudiante", institucion=self.inst)
        self.group = Group.objects.create(nombre="G-B", classroom=Classroom.objects.create(nombre="Aula B", docente=self.docente))
        self.group.estudiantes.add(self.e1, self.e2)
        self.periodo = Period.objects.filter(grupo=self.group, activo=True).first()
        for e in (self.e1, self.e2):
            Wallet.objects.create(usuario=e, grupo=self.group, periodo=self.periodo, saldo_educoins=0)
        self.act = Activity.objects.create(group=self.group, nombre="Quiz", tipo="quiz", valor_educoins=10,
                                           puntos_experiencia=100, fecha_entrega=timezone.now() + timedelta(days=2))
        self.c = APIClient()
        self.c.force_authenticate(user=self.docente)

    def test_bulk_grading_is_all_or_nothing(self):
        res = self.c.post("/api/grades/calificar-multiple/", {"activity": self.act.id, "calificaciones": [
            {"student": self.e1.id, "nota": 90}, {"student": self.e2.id, "nota": 250}]}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Grade.objects.count(), 0)
        self.assertEqual(Wallet.objects.get(usuario=self.e1).saldo_educoins, 0)

    def test_bulk_grading_success_pays_each_student_once(self):
        res = self.c.post("/api/grades/calificar-multiple/", {"activity": self.act.id, "calificaciones": [
            {"student": self.e1.id, "nota": 100}, {"student": self.e2.id, "nota": 50}]}, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["creadas"], 2)
        self.assertGreater(Wallet.objects.get(usuario=self.e1).saldo_educoins, Wallet.objects.get(usuario=self.e2).saldo_educoins)

    def test_creating_period_for_group_with_students_creates_wallets(self):
        res = self.c.post("/api/tokens/periods/", {"grupo": self.group.id, "nombre": "Corte extra",
                          "fecha_inicio": "2027-01-01", "fecha_fin": "2027-02-01", "activo": False}, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(Wallet.objects.filter(periodo_id=res.data["id"]).count(), 2)
