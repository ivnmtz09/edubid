from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.auctions.models import Auction, Bid
from apps.classrooms.models import Classroom
from apps.groups.models import Group
from apps.institutions.models import Institution
from apps.tokens.models import Period, Wallet
from apps.users.models import User


class AuctionUiContractTests(TestCase):
    """Contrato que el frontend ya usa: estadisticas y filtro de pujas por subasta."""

    def setUp(self):
        inst = Institution.objects.create(nombre="Colegio UI", codigo_dane="515151")
        self.docente = User.objects.create_user(username="ui_doc", email="ui_doc@edubid.com", password="x", role="docente", institucion=inst)
        self.est = User.objects.create_user(username="ui_est", email="ui_est@edubid.com", password="x", role="estudiante", institucion=inst)
        self.group = Group.objects.create(nombre="G-UI", classroom=Classroom.objects.create(nombre="Aula UI", docente=self.docente))
        self.group.estudiantes.add(self.est)
        periodo = Period.objects.filter(grupo=self.group, activo=True).first()
        Wallet.objects.create(usuario=self.est, grupo=self.group, periodo=periodo, saldo_educoins=100, bloqueado_educoins=30)
        mk = lambda estado: Auction.objects.create(
            titulo=f"A-{estado}", creador=self.docente, grupo=self.group, estado=estado,
            fecha_fin=timezone.now() + timedelta(days=1), valor_minimo_educoins=10, incremento_minimo_educoins=5)
        self.activa, self.cerrada = mk("active"), mk("closed")
        Bid.objects.create(auction=self.activa, estudiante=self.est, cantidad_educoins=20, registrado_por=self.est)
        Bid.objects.create(auction=self.cerrada, estudiante=self.est, cantidad_educoins=10, registrado_por=self.est)
        self.c = APIClient()
        self.c.force_authenticate(user=self.docente)

    def test_stats_expose_the_keys_the_frontend_reads(self):
        data = self.c.get("/api/auctions/auctions/stats/").data
        self.assertEqual((data["activas"], data["cerradas"], data["totales"]), (1, 1, 2))
        self.assertEqual((data["total_activas"], data["total_cerradas"], data["total_generales"]), (1, 1, 2))

    def test_bid_history_is_filtered_by_auction(self):
        res = self.c.get(f"/api/auctions/bids/?auction={self.activa.id}")
        rows = res.data["results"] if isinstance(res.data, dict) and "results" in res.data else res.data
        self.assertEqual([r["auction"] for r in rows], [self.activa.id])
        everything = self.c.get("/api/auctions/bids/")
        rows = everything.data["results"] if isinstance(everything.data, dict) and "results" in everything.data else everything.data
        self.assertEqual(len(rows), 2)
        self.assertEqual(self.c.get("/api/auctions/bids/?auction=abc").status_code, 200)
