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
