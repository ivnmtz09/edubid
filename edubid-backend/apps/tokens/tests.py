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



class WalletReadOnlyAndAtomicityTests(TestCase):
    """El saldo no se edita desde la API y las operaciones de dinero no pierden actualizaciones."""

    def setUp(self):
        from rest_framework.test import APIClient
        self.inst = Institution.objects.create(nombre="Colegio W", codigo_dane="777001")
        mk = lambda n, r: User.objects.create_user(username=n, email=f"{n}@edubid.com", password="x", role=r, institucion=self.inst if r != 'admin' else None)
        self.docente, self.est, self.est2, self.admin = mk("w_doc", "docente"), mk("w_est", "estudiante"), mk("w_est2", "estudiante"), mk("w_adm", "admin")
        self.group = Group.objects.create(nombre="G-W", classroom=Classroom.objects.create(nombre="Aula W", docente=self.docente))
        self.group.estudiantes.add(self.est, self.est2)
        periodo = Period.objects.filter(grupo=self.group, activo=True).first()
        self.w1 = Wallet.objects.create(usuario=self.est, grupo=self.group, periodo=periodo, saldo_educoins=60)
        self.w2 = Wallet.objects.create(usuario=self.est2, grupo=self.group, periodo=periodo, saldo_educoins=10)
        self.api = lambda u: (lambda c: (c.force_authenticate(user=u), c)[1])(APIClient())

    def test_student_and_teacher_cannot_modify_balances(self):
        for user in (self.est, self.docente):
            c = self.api(user)
            for method, payload in (("patch", {"saldo_educoins": 999999}), ("put", {"saldo_educoins": 999999}), ("delete", None)):
                res = getattr(c, method)(f"/api/tokens/wallets/{self.w1.id}/", payload, format="json") if payload else getattr(c, method)(f"/api/tokens/wallets/{self.w1.id}/")
                self.assertEqual(res.status_code, 405, f"{user.role} {method}")
            self.assertEqual(c.post("/api/tokens/wallets/", {"usuario": user.id, "grupo": self.group.id, "saldo_educoins": 5}, format="json").status_code, 405)
        self.w1.refresh_from_db()
        self.assertEqual(self.w1.saldo_educoins, 60)

    def test_owner_can_still_read_own_wallet_but_not_others(self):
        c = self.api(self.est)
        self.assertEqual(c.get(f"/api/tokens/wallets/{self.w1.id}/").status_code, 200)
        self.assertEqual(c.get(f"/api/tokens/wallets/{self.w2.id}/").status_code, 404)
        self.assertEqual(c.get("/api/tokens/wallets/mi-wallet/").status_code, 200)

    def test_only_admin_can_deposit_through_api(self):
        for user in (self.est, self.docente):
            self.assertEqual(self.api(user).post(f"/api/tokens/wallets/{self.w1.id}/depositar/", {"cantidad": 50}, format="json").status_code, 403)
        res = self.api(self.admin).post(f"/api/tokens/wallets/{self.w1.id}/depositar/", {"cantidad": 50, "descripcion": "ajuste"}, format="json")
        self.assertEqual(res.status_code, 200, res.data)
        self.w1.refresh_from_db()
        self.assertEqual(self.w1.saldo_educoins, 110)
        self.assertEqual(CoinTransaction.objects.filter(wallet=self.w1, tipo="earn", cantidad_educoins=50).count(), 1)
        bad = self.api(self.admin).post(f"/api/tokens/wallets/{self.w1.id}/depositar/", {"cantidad": "abc"}, format="json")
        self.assertEqual(bad.status_code, 400)

    def test_stale_wallet_objects_do_not_lose_updates(self):
        """Dos copias desactualizadas de la misma billetera depositan: el resultado debe sumar ambas."""
        a = Wallet.objects.get(pk=self.w1.pk)
        b = Wallet.objects.get(pk=self.w1.pk)
        a.depositar(10, "a")
        b.depositar(5, "b")      # b tenia saldo 60 en memoria; sin bloqueo sobrescribiria el deposito de a
        self.w1.refresh_from_db()
        self.assertEqual(self.w1.saldo_educoins, 75)
        self.assertEqual(b.saldo_educoins, 75)
        self.assertEqual(CoinTransaction.objects.filter(wallet=self.w1).count(), 2)
        c = Wallet.objects.get(pk=self.w1.pk)
        d = Wallet.objects.get(pk=self.w1.pk)
        c.gastar(20, "c")
        with self.assertRaises(ValueError):
            d.gastar(70, "d")    # el saldo real es 55; la copia vieja creia 75
        self.w1.refresh_from_db()
        self.assertEqual(self.w1.saldo_educoins, 55)

    def test_closing_an_auction_twice_charges_only_once(self):
        from datetime import timedelta
        from django.utils import timezone
        from apps.auctions.models import Auction, Bid
        from apps.auctions.services import cerrar_subasta
        a = Auction.objects.create(titulo="X", creador=self.docente, grupo=self.group, estado="active",
                                   fecha_fin=timezone.now() + timedelta(days=1), valor_minimo_educoins=10, incremento_minimo_educoins=5)
        Bid.objects.create(auction=a, estudiante=self.est, cantidad_educoins=40, registrado_por=self.est)
        Wallet.objects.filter(pk=self.w1.pk).update(bloqueado_educoins=40)
        stale = Auction.objects.get(pk=a.pk)     # segundo cierre con un objeto aun "active"
        self.assertTrue(cerrar_subasta(a)["success"])
        self.assertFalse(cerrar_subasta(stale)["success"])
        self.w1.refresh_from_db()
        self.assertEqual((self.w1.saldo_educoins, self.w1.bloqueado_educoins), (20, 0))
        self.assertEqual(CoinTransaction.objects.filter(wallet=self.w1, tipo="spend").count(), 1)
