from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.users.models import User
from apps.institutions.models import Institution
from apps.classrooms.models import Classroom
from apps.groups.models import Group
from apps.activities.models import Activity, Submission


class ActivityAndSubmissionTests(TestCase):
    def setUp(self):
        self.institucion_a = Institution.objects.create(
            nombre="Instituto Tecnológico A",
            codigo_dane="700001"
        )
        self.institucion_b = Institution.objects.create(
            nombre="Instituto Tecnológico B",
            codigo_dane="700002"
        )

        self.docente_a = User.objects.create_user(
            username="docente_act_a",
            email="docente_act_a@edubid.com",
            password="password123",
            role="docente",
            institucion=self.institucion_a
        )

        self.docente_b = User.objects.create_user(
            username="docente_act_b",
            email="docente_act_b@edubid.com",
            password="password123",
            role="docente",
            institucion=self.institucion_b
        )

        self.estudiante_a = User.objects.create_user(
            username="estudiante_act_a",
            email="estudiante_act_a@edubid.com",
            password="password123",
            role="estudiante",
            institucion=self.institucion_a
        )

        self.estudiante_b = User.objects.create_user(
            username="estudiante_act_b",
            email="estudiante_act_b@edubid.com",
            password="password123",
            role="estudiante",
            institucion=self.institucion_b
        )

        self.classroom_a = Classroom.objects.create(
            nombre="Programación Python",
            docente=self.docente_a
        )
        self.group_a = Group.objects.create(
            nombre="Grupo Python-1",
            classroom=self.classroom_a
        )
        self.group_a.estudiantes.add(self.estudiante_a)

        self.classroom_b = Classroom.objects.create(
            nombre="Bases de Datos",
            docente=self.docente_b
        )
        self.group_b = Group.objects.create(
            nombre="Grupo BD-1",
            classroom=self.classroom_b
        )
        self.group_b.estudiantes.add(self.estudiante_b)

        self.actividad_a = Activity.objects.create(
            group=self.group_a,
            tipo="reto",
            nombre="Reto de Recursión",
            descripcion="Resolver problema de Torres de Hanói",
            valor_educoins=50,
            puntos_experiencia=15,
            fecha_entrega=timezone.now() + timedelta(days=5),
            habilitada=True
        )

        self.client = APIClient()

    def test_docente_puede_crear_actividad_en_su_grupo(self):
        """Un docente puede crear actividades en los grupos que le pertenecen."""
        self.client.force_authenticate(user=self.docente_a)
        data = {
            "group": self.group_a.id,
            "tipo": "mision",
            "nombre": "Misión Decoradores",
            "descripcion": "Implementar decorador de caching",
            "valor_educoins": 80,
            "puntos_experiencia": 20,
            "fecha_entrega": (timezone.now() + timedelta(days=3)).isoformat(),
            "habilitada": True
        }
        response = self.client.post("/api/activities/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["nombre"], "Misión Decoradores")

    def test_docente_no_puede_crear_actividad_en_grupo_ajeno(self):
        """Un docente no puede crear actividades en un grupo de otro docente (PermissionDenied)."""
        self.client.force_authenticate(user=self.docente_a)
        data = {
            "group": self.group_b.id,
            "tipo": "reto",
            "nombre": "Actividad Infiltrada",
            "fecha_entrega": (timezone.now() + timedelta(days=1)).isoformat()
        }
        response = self.client.post("/api/activities/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_estudiante_puede_entregar_actividad_habilitada(self):
        """Un estudiante inscrito puede enviar una entrega a la actividad."""
        self.client.force_authenticate(user=self.estudiante_a)
        data = {
            "activity": self.actividad_a.id,
            "contenido": "Solución al reto en Python adjunta en el texto."
        }
        response = self.client.post("/api/submissions/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Submission.objects.filter(activity=self.actividad_a, estudiante=self.estudiante_a).exists())

    def test_docente_no_puede_hacer_submission(self):
        """Solo los usuarios con rol 'estudiante' pueden registrar entregas."""
        self.client.force_authenticate(user=self.docente_a)
        data = {
            "activity": self.actividad_a.id,
            "contenido": "Entrega fraudulenta"
        }
        response = self.client.post("/api/submissions/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_estudiante_cancela_entrega_no_calificada(self):
        """Un estudiante puede cancelar su entrega siempre que aún no esté calificada."""
        submission = Submission.objects.create(
            activity=self.actividad_a,
            estudiante=self.estudiante_a,
            contenido="Primer intento"
        )
        self.client.force_authenticate(user=self.estudiante_a)
        response = self.client.delete(f"/api/submissions/{submission.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Submission.objects.filter(id=submission.id).exists())

    def test_estudiante_no_puede_cancelar_entrega_ya_calificada(self):
        """No se permite cancelar una entrega si el docente ya emitió una calificación."""
        submission = Submission.objects.create(
            activity=self.actividad_a,
            estudiante=self.estudiante_a,
            contenido="Solución definitiva",
            calificacion=95.00
        )
        self.client.force_authenticate(user=self.estudiante_a)
        response = self.client.delete(f"/api/submissions/{submission.id}/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Submission.objects.filter(id=submission.id).exists())

    def test_estudiante_no_puede_entregar_en_grupo_ajeno(self):
        """Un estudiante no puede enviar entregas a actividades de grupos donde no está inscrito."""
        self.client.force_authenticate(user=self.estudiante_b)
        data = {
            "activity": self.actividad_a.id,
            "contenido": "Intento de entrega no autorizada"
        }
        response = self.client.post("/api/submissions/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("detail", response.data)

    def test_estudiante_no_puede_entregar_actividad_vencida(self):
        """No se permite entregar actividades cuya fecha límite ya expiró."""
        actividad_vencida = Activity.objects.create(
            group=self.group_a,
            tipo="reto",
            nombre="Reto Expirado",
            valor_educoins=30,
            puntos_experiencia=10,
            fecha_entrega=timezone.now() - timedelta(hours=2),
            habilitada=True
        )
        self.client.force_authenticate(user=self.estudiante_a)
        data = {
            "activity": actividad_vencida.id,
            "contenido": "Entrega tardía"
        }
        response = self.client.post("/api/submissions/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)
