from django.test import TestCase
from django.core import mail
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.reports.models import UserReport

User = get_user_model()


class CreateReportViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            first_name='Test',
            last_name='User',
            password='Password123!'
        )

    def test_create_report_anonymous(self):
        payload = {
            'tipo': 'bug',
            'asunto': 'Problema con la pantalla principal',
            'descripcion': 'El botón no responde al hacer clic.',
            'email_contacto': 'anon@example.com',
            'nombre_contacto': 'Usuario Anónimo',
            'pagina_origen': '/dashboard',
            'navegador_info': 'Chrome 120 / Linux'
        }
        response = self.client.post('/api/reports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get('success'))
        self.assertIn('id', response.data)

        report = UserReport.objects.get(id=response.data['id'])
        self.assertIsNone(report.user)
        self.assertEqual(report.email_contacto, 'anon@example.com')
        self.assertEqual(report.asunto, 'Problema con la pantalla principal')
        self.assertEqual(report.estado, 'pendiente')

        # Verificar envío de correo
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('[EduBid Reporte]', mail.outbox[0].subject)
        self.assertIn('ivanjmm01@gmail.com', mail.outbox[0].to)

    def test_create_report_authenticated_autofill(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'tipo': 'sugerencia',
            'asunto': 'Mejora en subastas',
            'descripcion': 'Agregar notificaciones push en tiempo real.',
        }
        response = self.client.post('/api/reports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        report = UserReport.objects.get(id=response.data['id'])
        self.assertEqual(report.user, self.user)
        self.assertEqual(report.email_contacto, self.user.email)
        self.assertEqual(report.nombre_contacto, 'Test User')
        self.assertEqual(report.tipo, 'sugerencia')

        # Verificar envío de correo
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Mejora en subastas', mail.outbox[0].subject)
        self.assertIn('Test User', mail.outbox[0].body)

    def test_create_report_validation_error(self):
        response = self.client.post('/api/reports/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('asunto', response.data)
        self.assertIn('descripcion', response.data)
