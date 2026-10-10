from django.test import TestCase
from django.db import IntegrityError, transaction
from apps.users.models import User
from apps.institutions.models import Institution
from apps.classrooms.models import Classroom
from apps.groups.models import Group
from apps.tokens.models import Wallet, Period, CoinTransaction


class WalletAndPeriodTests(TestCase):
    def setUp(self):
        self.institucion = Institution.objects.create(
            nombre="Institución Educativa Tokens",
            codigo_dane="998877"
        )
        self.docente = User.objects.create_user(
            username="docente_tokens",
            email="docente_tokens@edubid.com",
            password="password123",
            role="docente",
            institucion=self.institucion
        )
        self.estudiante = User.objects.create_user(
            username="estudiante_tokens",
            email="estudiante_tokens@edubid.com",
            password="password123",
            role="estudiante",
            institucion=self.institucion
        )
        self.classroom = Classroom.objects.create(
            nombre="Física Cuántica",
            docente=self.docente
        )
        # La creación de un Group crea automáticamente 3 periodos (Corte 1, 2, 3)
        self.group = Group.objects.create(
            nombre="Grupo F-1",
            classroom=self.classroom
        )
        self.periodos = list(self.group.periodos.order_by("creado"))
        self.periodo_activo = self.periodos[0]

        self.wallet = Wallet.objects.create(
            usuario=self.estudiante,
            grupo=self.group,
            periodo=self.periodo_activo,
            saldo_educoins=0,
            bloqueado_educoins=0
        )

    def test_wallet_deposit_increases_balance_and_creates_transaction(self):
        """depositar() incrementa el saldo y registra una CoinTransaction de tipo earn."""
        self.wallet.depositar(150, "Premio por primer puesto en trivia")
        self.wallet.refresh_from_db()

        self.assertEqual(self.wallet.saldo_educoins, 150)
        self.assertEqual(self.wallet.bloqueado_educoins, 0)

        tx = CoinTransaction.objects.filter(wallet=self.wallet, tipo="earn").first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.cantidad_educoins, 150)
        self.assertIn("Premio por primer puesto", tx.descripcion)

    def test_wallet_spend_decreases_balance_and_creates_transaction(self):
        """gastar() descuenta del saldo y registra una CoinTransaction de tipo spend."""
        self.wallet.saldo_educoins = 200
        self.wallet.save()

        self.wallet.gastar(80, "Compra de beneficio académico")
        self.wallet.refresh_from_db()

        self.assertEqual(self.wallet.saldo_educoins, 120)

        tx = CoinTransaction.objects.filter(wallet=self.wallet, tipo="spend").first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.cantidad_educoins, 80)

    def test_wallet_spend_insufficient_funds_raises_error(self):
        """gastar() lanza ValueError si la cantidad solicitada excede el saldo_educoins."""
        self.wallet.saldo_educoins = 30
        self.wallet.save()

        with self.assertRaises(ValueError) as ctx:
            self.wallet.gastar(50, "Intento de compra sin fondos")

        self.assertIn("Fondos insuficientes", str(ctx.exception))
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.saldo_educoins, 30)

    def test_wallet_reset_clears_balance_and_blocked(self):
        """resetear() lleva a 0 el saldo y saldo bloqueado y registra CoinTransaction de tipo reset."""
        self.wallet.saldo_educoins = 250
        self.wallet.bloqueado_educoins = 50
        self.wallet.save()

        self.wallet.resetear("Cierre de período escolar")
        self.wallet.refresh_from_db()

        self.assertEqual(self.wallet.saldo_educoins, 0)
        self.assertEqual(self.wallet.bloqueado_educoins, 0)

        tx = CoinTransaction.objects.filter(wallet=self.wallet, tipo="reset").first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.cantidad_educoins, 250)

    def test_period_auto_creation_and_switching(self):
        """Al crear un grupo se crean 3 periodos; activar() alterna el periodo activo."""
        self.assertEqual(len(self.periodos), 3)
        self.assertTrue(self.periodos[0].activo)
        self.assertFalse(self.periodos[1].activo)
        self.assertFalse(self.periodos[2].activo)

        # Activar el Corte 2 debe desactivar el Corte 1
        self.periodos[1].activar()

        self.periodos[0].refresh_from_db()
        self.periodos[1].refresh_from_db()
        self.periodos[2].refresh_from_db()

        self.assertFalse(self.periodos[0].activo)
        self.assertTrue(self.periodos[1].activo)
        self.assertFalse(self.periodos[2].activo)

    def test_wallet_unique_together_constraint(self):
        """No se puede crear más de una wallet para el mismo (usuario, grupo, periodo)."""
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Wallet.objects.create(
                    usuario=self.estudiante,
                    grupo=self.group,
                    periodo=self.periodo_activo,
                    saldo_educoins=50
                )


class PeriodAccessControlSecurityTestCase(TestCase):
    """
    Pruebas de aislamiento multi-tenant y control de acceso en PeriodViewSet.
    """
    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()

        # Institución A
        self.inst_a = Institution.objects.create(nombre="Institución A", codigo_dane="555001")
        self.rector_a = User.objects.create_user(
            username="rector_ta", email="rector_ta@edubid.com", password="password123",
            role="rector", institucion=self.inst_a
        )
        self.docente_a = User.objects.create_user(
            username="docente_ta", email="docente_ta@edubid.com", password="password123",
            role="docente", institucion=self.inst_a
        )
        self.classroom_a = Classroom.objects.create(nombre="Ciencias A", docente=self.docente_a)
        self.group_a = Group.objects.create(nombre="Grupo 1-A", classroom=self.classroom_a)

        # Institución B
        self.inst_b = Institution.objects.create(nombre="Institución B", codigo_dane="555002")
        self.rector_b = User.objects.create_user(
            username="rector_tb", email="rector_tb@edubid.com", password="password123",
            role="rector", institucion=self.inst_b
        )
        self.docente_b = User.objects.create_user(
            username="docente_tb", email="docente_tb@edubid.com", password="password123",
            role="docente", institucion=self.inst_b
        )
        self.classroom_b = Classroom.objects.create(nombre="Ciencias B", docente=self.docente_b)
        self.group_b = Group.objects.create(nombre="Grupo 1-B", classroom=self.classroom_b)

    def test_cross_school_directivo_cannot_create_period(self):
        """Rector de Institución A no puede crear periodos para un grupo de Institución B."""
        self.client.force_authenticate(user=self.rector_a)
        payload = {
            "nombre": "Corte Extraordinario",
            "grupo": self.group_b.id,
            "activo": False
        }
        res = self.client.post("/api/tokens/periods/", payload, format="json")
        self.assertEqual(res.status_code, 400)

    def test_mis_periodos_filters_by_institution(self):
        """mis_periodos no filtra periodos de otras instituciones para el rector."""
        self.client.force_authenticate(user=self.rector_a)
        res = self.client.get("/api/tokens/periods/mis_periodos/")
        self.assertEqual(res.status_code, 200)

        grupos_devueltos = [p["grupo"] for p in res.data]
        self.assertIn(self.group_a.id, grupos_devueltos)
        self.assertNotIn(self.group_b.id, grupos_devueltos)

