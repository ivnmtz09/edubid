from datetime import timedelta
from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from django.core.management import call_command
from rest_framework.test import APIClient

from apps.users.models import User
from apps.institutions.models import Institution
from apps.classrooms.models import Classroom
from apps.groups.models import Group
from apps.tokens.models import Wallet, Period, CoinTransaction
from apps.auctions.models import Auction, Bid
from apps.notifications.models import Notification
from apps.auctions.services import cerrar_subasta, cerrar_subastas_expiradas


class AuctionClosingTests(TestCase):
    def setUp(self):
        self.institucion = Institution.objects.create(
            nombre="Instituto Tecnológico EduBid",
            codigo_dane="12345678"
        )
        self.docente = User.objects.create_user(
            username="docente_test",
            email="docente@edubid.com",
            password="password123",
            role="docente",
            institucion=self.institucion
        )
        self.estudiante_ganador = User.objects.create_user(
            username="estudiante1",
            email="estudiante1@edubid.com",
            password="password123",
            role="estudiante",
            institucion=self.institucion
        )
        self.estudiante_postor = User.objects.create_user(
            username="estudiante2",
            email="estudiante2@edubid.com",
            password="password123",
            role="estudiante",
            institucion=self.institucion
        )

        self.classroom = Classroom.objects.create(
            nombre="Programación Web",
            docente=self.docente
        )
        self.group = Group.objects.create(
            nombre="Grupo A",
            classroom=self.classroom
        )
        self.group.estudiantes.add(self.estudiante_ganador, self.estudiante_postor)

        self.periodo = Period.objects.filter(grupo=self.group, activo=True).first()

        self.wallet_ganador = Wallet.objects.create(
            usuario=self.estudiante_ganador,
            grupo=self.group,
            periodo=self.periodo,
            saldo_educoins=100,
            bloqueado_educoins=50
        )
        self.wallet_postor = Wallet.objects.create(
            usuario=self.estudiante_postor,
            grupo=self.group,
            periodo=self.periodo,
            saldo_educoins=80,
            bloqueado_educoins=30
        )

    def test_cerrar_subasta_con_ganador_y_devolucion_fondos(self):
        """
        Verifica que al cerrar una subasta:
        - Se cobre al ganador (saldo y bloqueado se descuentan).
        - Se genere la transacción de gasto (spend).
        - Se liberen los fondos bloqueados de los postores perdedores.
        - Se creen las notificaciones para ganador, perdedores y docente.
        """
        auction = Auction.objects.create(
            titulo="1 Punto Extra en Parcial",
            creador=self.docente,
            grupo=self.group,
            estado="active",
            fecha_fin=timezone.now() + timedelta(days=1),
            valor_minimo_educoins=10,
            incremento_minimo_educoins=5
        )

        # Puja perdedora (30 EC)
        Bid.objects.create(
            auction=auction,
            estudiante=self.estudiante_postor,
            cantidad_educoins=30,
            registrado_por=self.estudiante_postor
        )
        # Puja ganadora (50 EC)
        Bid.objects.create(
            auction=auction,
            estudiante=self.estudiante_ganador,
            cantidad_educoins=50,
            registrado_por=self.estudiante_ganador
        )

        # Ejecutar cierre
        resultado = cerrar_subasta(auction)

        self.assertTrue(resultado["success"])
        self.assertEqual(resultado["ganador"]["id"], self.estudiante_ganador.id)
        self.assertEqual(resultado["ganador"]["monto_pagado"], 50)

        # Verificar estado de subasta
        auction.refresh_from_db()
        self.assertEqual(auction.estado, "closed")

        # Verificar wallet del ganador (100 saldo inicial - 50 = 50 saldo, bloqueado = 0)
        self.wallet_ganador.refresh_from_db()
        self.assertEqual(self.wallet_ganador.saldo_educoins, 50)
        self.assertEqual(self.wallet_ganador.bloqueado_educoins, 0)

        # Verificar transacción registrada
        tx = CoinTransaction.objects.filter(wallet=self.wallet_ganador, tipo="spend").first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.cantidad_educoins, 50)

        # Verificar wallet del perdedor (80 saldo intacto, bloqueado pasa de 30 a 0)
        self.wallet_postor.refresh_from_db()
        self.assertEqual(self.wallet_postor.saldo_educoins, 80)
        self.assertEqual(self.wallet_postor.bloqueado_educoins, 0)

        # Verificar notificaciones
        notif_ganador = Notification.objects.filter(
            usuario=self.estudiante_ganador,
            tipo="subasta_ganada"
        ).first()
        self.assertIsNotNone(notif_ganador)

        notif_postor = Notification.objects.filter(
            usuario=self.estudiante_postor,
            tipo="subasta_abierta"
        ).first()
        self.assertIsNotNone(notif_postor)

        notif_docente = Notification.objects.filter(
            usuario=self.docente,
            tipo="subasta_abierta"
        ).first()
        self.assertIsNotNone(notif_docente)

    def test_cerrar_subasta_sin_pujas(self):
        """Verifica que una subasta sin ofertas se cierre correctamente y notifique al docente."""
        auction = Auction.objects.create(
            titulo="Insignia de Oro",
            creador=self.docente,
            grupo=self.group,
            estado="active",
            fecha_fin=timezone.now() + timedelta(days=1),
            valor_minimo_educoins=20
        )

        resultado = cerrar_subasta(auction)

        self.assertTrue(resultado["success"])
        self.assertIsNone(resultado["ganador"])
        self.assertEqual(resultado["total_participantes"], 0)

        auction.refresh_from_db()
        self.assertEqual(auction.estado, "closed")

        notif_docente = Notification.objects.filter(
            usuario=self.docente,
            metadata__resultado="sin_pujas"
        ).first()
        self.assertIsNotNone(notif_docente)

    def test_cerrar_subastas_expiradas(self):
        """Verifica que solo se cierren las subastas activas cuya fecha de fin ya expiró."""
        subasta_vencida = Auction.objects.create(
            titulo="Subasta Vencida",
            creador=self.docente,
            grupo=self.group,
            estado="active",
            fecha_fin=timezone.now() - timedelta(hours=2),
            valor_minimo_educoins=10
        )
        subasta_futura = Auction.objects.create(
            titulo="Subasta Vigente",
            creador=self.docente,
            grupo=self.group,
            estado="active",
            fecha_fin=timezone.now() + timedelta(hours=5),
            valor_minimo_educoins=10
        )

        resultados = cerrar_subastas_expiradas()
        self.assertEqual(len(resultados), 1)
        self.assertEqual(resultados[0]["auction_id"], subasta_vencida.id)

        subasta_vencida.refresh_from_db()
        subasta_futura.refresh_from_db()

        self.assertEqual(subasta_vencida.estado, "closed")
        self.assertEqual(subasta_futura.estado, "active")

    def test_management_command_close_expired_auctions(self):
        """Verifica la ejecución del comando manage.py close_expired_auctions."""
        subasta = Auction.objects.create(
            titulo="Subasta para comando CLI",
            creador=self.docente,
            grupo=self.group,
            estado="active",
            fecha_fin=timezone.now() - timedelta(minutes=10),
            valor_minimo_educoins=5
        )

        # Probar modo dry-run (no debe cerrar)
        call_command("close_expired_auctions", "--dry-run")
        subasta.refresh_from_db()
        self.assertEqual(subasta.estado, "active")

        # Probar ejecución real
        call_command("close_expired_auctions")
        subasta.refresh_from_db()
        self.assertEqual(subasta.estado, "closed")

    def test_api_auto_cierre_al_listar_subastas(self):
        """Verifica que al consultar el listado vía API, las subastas vencidas se cierren automáticamente."""
        subasta_vencida = Auction.objects.create(
            titulo="Subasta Vencida API",
            creador=self.docente,
            grupo=self.group,
            estado="active",
            fecha_fin=timezone.now() - timedelta(minutes=5),
            valor_minimo_educoins=10
        )

        client = APIClient()
        client.force_authenticate(user=self.docente)

        response = client.get("/api/auctions/auctions/")
        self.assertEqual(response.status_code, 200)

        subasta_vencida.refresh_from_db()
        self.assertEqual(subasta_vencida.estado, "closed")

    def test_estudiante_no_puede_pujar_en_subasta_de_otro_grupo(self):
        """Un estudiante que no pertenece al grupo de la subasta no puede pujar."""
        otro_estudiante = User.objects.create_user(
            username="estudiante_externo",
            email="externo@edubid.com",
            password="password123",
            role="estudiante",
            institucion=self.institucion
        )
        subasta = Auction.objects.create(
            titulo="Subasta Restringida",
            creador=self.docente,
            grupo=self.group,
            estado="active",
            fecha_fin=timezone.now() + timedelta(days=2),
            valor_minimo_educoins=10
        )
        client = APIClient()
        client.force_authenticate(user=otro_estudiante)
        response = client.post("/api/auctions/bids/", {
            "auction": subasta.id,
            "estudiante": otro_estudiante.id,
            "cantidad_educoins": 20
        }, format="json")
        self.assertIn(response.status_code, [400, 403])
        self.assertIn("no pertenece al grupo", str(response.data))

    def test_eliminar_subasta_activa_libera_monedas_bloqueadas(self):
        """Eliminar una subasta activa libera los fondos bloqueados de los postores de manera segura."""
        subasta = Auction.objects.create(
            titulo="Subasta Para Cancelar",
            creador=self.docente,
            grupo=self.group,
            estado="active",
            fecha_fin=timezone.now() + timedelta(days=1),
            valor_minimo_educoins=10
        )
        Bid.objects.create(
            auction=subasta,
            estudiante=self.estudiante_ganador,
            cantidad_educoins=40,
            registrado_por=self.estudiante_ganador
        )
        self.wallet_ganador.bloqueado_educoins = 40
        self.wallet_ganador.save()

        client = APIClient()
        client.force_authenticate(user=self.docente)
        response = client.delete(f"/api/auctions/auctions/{subasta.id}/")
        self.assertEqual(response.status_code, 204)

        self.wallet_ganador.refresh_from_db()
        self.assertEqual(self.wallet_ganador.bloqueado_educoins, 0)


class AuctionWebSocketTests(TransactionTestCase):
    """El WebSocket exige JWT y solo entrega eventos de los grupos que el usuario puede ver."""

    def setUp(self):
        from rest_framework_simplejwt.tokens import AccessToken
        self.inst_a = Institution.objects.create(nombre="Colegio A", codigo_dane="11111111")
        self.inst_b = Institution.objects.create(nombre="Colegio B", codigo_dane="22222222")
        self.docente_a = User.objects.create_user(
            username="doc_a", email="doc_a@edubid.com", password="x", role="docente", institucion=self.inst_a)
        self.est_a = User.objects.create_user(
            username="est_a", email="est_a@edubid.com", password="x", role="estudiante", institucion=self.inst_a)
        self.est_b = User.objects.create_user(
            username="est_b", email="est_b@edubid.com", password="x", role="estudiante", institucion=self.inst_b)
        self.rector_b = User.objects.create_user(
            username="rec_b", email="rec_b@edubid.com", password="x", role="rector", institucion=self.inst_b)
        self.admin = User.objects.create_user(
            username="adm", email="adm@edubid.com", password="x", role="admin")
        self.group_a = Group.objects.create(
            nombre="Grupo A", classroom=Classroom.objects.create(nombre="Aula A", docente=self.docente_a))
        self.group_a.estudiantes.add(self.est_a)
        self.token = lambda u: str(AccessToken.for_user(u))

    def _communicator(self, path, user=None, token=None):
        from channels.testing import WebsocketCommunicator
        from edubid_core.asgi import application
        t = token if token is not None else (self.token(user) if user else None)
        return WebsocketCommunicator(application, path + (f"?token={t}" if t else ""))

    async def _broadcast(self):
        from channels.layers import get_channel_layer
        layer = get_channel_layer()
        payload = {"type": "bid_update", "data": {"event": "bid_created", "grupo_id": self.group_a.id}}
        await layer.group_send(f"auctions_group_{self.group_a.id}", payload)
        await layer.group_send("auctions_general", payload)

    async def test_anonymous_and_invalid_token_rejected(self):
        for kwargs in ({}, {"token": "no-es-un-jwt"}):
            comm = self._communicator("/ws/auctions/", **kwargs)
            connected, _ = await comm.connect()
            self.assertFalse(connected)

    async def test_student_connects_and_receives_only_own_group_events(self):
        comm = self._communicator("/ws/auctions/", self.est_a)
        connected, _ = await comm.connect()
        self.assertTrue(connected)
        self.assertEqual((await comm.receive_json_from())["type"], "connection_established")
        await self._broadcast()
        self.assertEqual((await comm.receive_json_from())["event"], "bid_created")
        self.assertTrue(await comm.receive_nothing())  # el canal general global ya no le llega
        await comm.disconnect()

    async def test_user_from_other_institution_gets_no_events(self):
        for user in (self.est_b, self.rector_b):
            comm = self._communicator("/ws/auctions/", user)
            connected, _ = await comm.connect()
            self.assertTrue(connected)
            await comm.receive_json_from()
            await self._broadcast()
            self.assertTrue(await comm.receive_nothing())
            await comm.disconnect()

    async def test_cannot_join_group_room_not_allowed(self):
        comm = self._communicator(f"/ws/auctions/{self.group_a.id}/", self.est_b)
        connected, _ = await comm.connect()
        self.assertFalse(connected)

    async def test_admin_receives_events_and_ping_pong(self):
        comm = self._communicator("/ws/auctions/", self.admin)
        connected, _ = await comm.connect()
        self.assertTrue(connected)
        await comm.receive_json_from()
        await comm.send_json_to({"type": "ping"})
        self.assertEqual((await comm.receive_json_from())["type"], "pong")
        await self._broadcast()
        self.assertEqual((await comm.receive_json_from())["event"], "bid_created")
        await comm.disconnect()


class BidAccessScopeTests(TestCase):
    """Aislamiento multi-tenant y roles en el listado de pujas por subasta."""

    def setUp(self):
        self.inst_a = Institution.objects.create(nombre="Colegio A", codigo_dane="11111111")
        self.inst_b = Institution.objects.create(nombre="Colegio B", codigo_dane="22222222")
        mk = lambda name, role, inst: User.objects.create_user(
            username=name, email=f"{name}@edubid.com", password="x", role=role, institucion=inst)
        self.docente = mk("doc_a", "docente", self.inst_a)
        self.estudiante = mk("est_a", "estudiante", self.inst_a)
        self.rector_a = mk("rec_a", "rector", self.inst_a)
        self.rector_b = mk("rec_b", "rector", self.inst_b)
        self.coord_b = mk("coord_b", "coordinador", self.inst_b)
        self.admin = mk("adm", "admin", None)
        self.group = Group.objects.create(
            nombre="Grupo A", classroom=Classroom.objects.create(nombre="Aula A", docente=self.docente))
        self.group.estudiantes.add(self.estudiante)
        periodo = Period.objects.filter(grupo=self.group, activo=True).first()
        Wallet.objects.create(usuario=self.estudiante, grupo=self.group, periodo=periodo,
                              saldo_educoins=100, bloqueado_educoins=20)
        self.auction = Auction.objects.create(
            titulo="Subasta", creador=self.docente, grupo=self.group, estado="active",
            fecha_fin=timezone.now() + timedelta(days=1),
            valor_minimo_educoins=10, incremento_minimo_educoins=5)
        Bid.objects.create(auction=self.auction, estudiante=self.estudiante,
                           cantidad_educoins=20, registrado_por=self.estudiante)

    def _get(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client.get(f"/api/auctions/bids/por-subasta/{self.auction.id}/")

    def test_by_auction_denied_for_other_institution_leadership(self):
        self.assertEqual(self._get(self.rector_b).status_code, 403)
        self.assertEqual(self._get(self.coord_b).status_code, 403)

    def test_by_auction_allowed_for_same_institution_and_admin(self):
        for user in (self.rector_a, self.admin, self.docente):
            res = self._get(user)
            self.assertEqual(res.status_code, 200, user.role)
            self.assertEqual(len(res.data["results"] if isinstance(res.data, dict) and "results" in res.data else res.data), 1)
        self.assertEqual(self._get(self.estudiante).status_code, 200)
