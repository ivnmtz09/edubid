from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.users.models import User
from apps.institutions.models import Institution
from apps.classrooms.models import Classroom
from apps.groups.models import Group
from apps.notifications.models import Notification


class NotificationModelAndApiTests(TestCase):
    def setUp(self):
        self.institucion = Institution.objects.create(
            nombre="Institución Educativa Notificaciones",
            codigo_dane="800001"
        )
        self.user_a = User.objects.create_user(
            username="usuario_a",
            email="usuario_a@edubid.com",
            password="password123",
            role="estudiante",
            institucion=self.institucion
        )
        self.user_b = User.objects.create_user(
            username="usuario_b",
            email="usuario_b@edubid.com",
            password="password123",
            role="estudiante",
            institucion=self.institucion
        )

        self.notif_a1 = Notification.objects.create(
            usuario=self.user_a,
            institucion=self.institucion,
            tipo="subasta_ganada",
            titulo="¡Ganaste la subasta!",
            mensaje="Felicidades por ganar 1 Punto Extra.",
            leida=False
        )
        self.notif_a2 = Notification.objects.create(
            usuario=self.user_a,
            institucion=self.institucion,
            tipo="calificacion",
            titulo="Nueva Calificación",
            mensaje="Tu tarea de Programación fue evaluada.",
            leida=True
        )
        self.notif_b = Notification.objects.create(
            usuario=self.user_b,
            institucion=self.institucion,
            tipo="monedas",
            titulo="EduCoins Recibidos",
            mensaje="Recibiste 50 EduCoins.",
            leida=False
        )

        self.client = APIClient()

    def test_modelo_marcar_como_leida(self):
        """Verifica el método helper marcar_como_leida en el modelo Notification."""
        self.assertFalse(self.notif_a1.leida)
        self.notif_a1.marcar_como_leida()
        self.notif_a1.refresh_from_db()
        self.assertTrue(self.notif_a1.leida)

    def test_usuario_solo_ve_sus_propias_notificaciones(self):
        """El listado /api/notifications/ solo retorna notificaciones del usuario autenticado."""
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [n["id"] for n in response.data]
        self.assertIn(self.notif_a1.id, ids)
        self.assertIn(self.notif_a2.id, ids)
        self.assertNotIn(self.notif_b.id, ids)

    def test_endpoint_no_leidas(self):
        """El endpoint /api/notifications/no-leidas/ filtra únicamente las no leídas."""
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get("/api/notifications/no-leidas/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 1)
        self.assertEqual(response.data["notificaciones"][0]["id"], self.notif_a1.id)

    def test_marcar_notificacion_especifica_leida(self):
        """POST /api/notifications/{id}/marcar-leida/ cambia leida a True."""
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(f"/api/notifications/{self.notif_a1.id}/marcar-leida/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif_a1.refresh_from_db()
        self.assertTrue(self.notif_a1.leida)

    def test_marcar_todas_leidas(self):
        """POST /api/notifications/marcar-todas-leidas/ marca todas las del usuario actual como leídas."""
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post("/api/notifications/marcar-todas-leidas/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif_a1.refresh_from_db()
        self.assertTrue(self.notif_a1.leida)

    def test_estadisticas_notificaciones(self):
        """GET /api/notifications/estadisticas/ retorna el conteo correcto de leídas, no leídas y total."""
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get("/api/notifications/estadisticas/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 2)
        self.assertEqual(response.data["no_leidas"], 1)
        self.assertEqual(response.data["leidas"], 1)
        self.assertEqual(response.data["por_tipo"]["subasta_ganada"], 1)

    def test_docente_puede_enviar_notificacion_a_estudiantes(self):
        """Un docente puede enviar notificaciones broadcast a todos sus estudiantes inscritos."""
        docente = User.objects.create_user(
            username="docente_notif",
            email="docente_notif@edubid.com",
            password="password123",
            role="docente",
            institucion=self.institucion
        )
        clase = Classroom.objects.create(nombre="Biología", docente=docente)
        grupo = Group.objects.create(nombre="Grupo Bio-1", classroom=clase)
        grupo.estudiantes.add(self.user_a, self.user_b)

        self.client.force_authenticate(user=docente)
        payload = {
            "titulo": "Recordatorio de Clase",
            "mensaje": "Mañana habrá laboratorio presencial.",
            "tipo": "anuncio"
        }
        response = self.client.post("/api/notifications/enviar-estudiantes/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", response.data)

        notif_a = Notification.objects.filter(usuario=self.user_a, titulo="Recordatorio de Clase").first()
        self.assertIsNotNone(notif_a)
        self.assertEqual(notif_a.institucion, self.institucion)

