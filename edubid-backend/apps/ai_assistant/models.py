from django.conf import settings
from django.db import models
from django.utils import timezone


class AIPendingAction(models.Model):
    """
    Accion sensible propuesta por el asistente (premiar EduCoins, calificar) que NO se ejecuta
    hasta que el usuario la confirme explicitamente desde la interfaz.
    """
    ESTADOS = [
        ('pending', 'Pendiente'),
        ('executed', 'Ejecutada'),
        ('failed', 'Fallida'),
        ('cancelled', 'Cancelada'),
        ('expired', 'Expirada'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_pending_actions')
    tool = models.CharField(max_length=60)
    arguments = models.JSONField(default=dict)
    resumen = models.CharField(max_length=400)
    estado = models.CharField(max_length=12, choices=ESTADOS, default='pending')
    resultado = models.JSONField(null=True, blank=True)
    creado = models.DateTimeField(auto_now_add=True)
    expira_en = models.DateTimeField()

    class Meta:
        ordering = ['-creado']

    def esta_vigente(self):
        return self.estado == 'pending' and timezone.now() < self.expira_en
