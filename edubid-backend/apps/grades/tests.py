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
