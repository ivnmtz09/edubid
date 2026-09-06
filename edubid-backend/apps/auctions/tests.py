from datetime import timedelta
from django.test import TestCase
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
