from django.test import TestCase
from rest_framework.test import APIClient

from apps.institutions.models import Institution
from apps.users.models import User


class UserListShowsAccountStateTests(TestCase):
    """El admin/rector debe ver quien esta inactivo (p. ej. docentes pendientes de aprobacion)."""

    def setUp(self):
        inst = Institution.objects.create(nombre="Colegio Estado", codigo_dane="424242")
        self.rector = User.objects.create_user(username="st_rec", email="st_rec@edubid.com", password="x", role="rector", institucion=inst)
        self.pending = User.objects.create_user(username="st_doc", email="st_doc@edubid.com", password="x", role="docente",
                                                institucion=inst, is_active=False, email_verified=True)
        self.c = APIClient()
        self.c.force_authenticate(user=self.rector)

    def test_list_exposes_is_active(self):
        rows = self.c.get("/api/users/list/").data
        rows = rows["results"] if isinstance(rows, dict) and "results" in rows else rows
        by_email = {r["email"]: r for r in rows}
        self.assertIs(by_email["st_doc@edubid.com"]["is_active"], False)
        self.assertIs(by_email["st_rec@edubid.com"]["is_active"], True)

    def test_is_active_is_read_only_in_profile_serializer(self):
        """Un usuario no puede reactivarse a si mismo por el perfil."""
        c = APIClient()
        c.force_authenticate(user=self.rector)
        res = c.patch("/api/users/profile/update/", {"is_active": False}, format="json")
        self.rector.refresh_from_db()
        self.assertTrue(self.rector.is_active)
        self.assertIn(res.status_code, (200, 400))
