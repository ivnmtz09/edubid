from django.db import models
from django.conf import settings
from apps.common.models import BaseModel

User = settings.AUTH_USER_MODEL


class Notification(BaseModel):
    TIPO_CHOICES = [
        ('actividad', 'Nueva Actividad'),
        ('calificacion', 'Calificación Recibida'),
        ('monedas', 'Monedas Recibidas'),
        ('subasta_nueva', 'Nueva Subasta'),
        ('subasta_ganada', 'Subasta Ganada'),
        ('anuncio', 'Anuncio'),
        ('general', 'General'),
        ('email_verificado', 'Email Verificado'),
        ('password_changed', 'Contraseña Cambiada'),
        ('password_reset', 'Contraseña Restablecida'),
        ('login_failed', 'Intento de Login Fallido'),
        ('account_security', 'Alerta de Seguridad'),
    ]

    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notificaciones'
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=255)
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    
    # Referencias opcionales a otros modelos
    activity_id = models.PositiveIntegerField(null=True, blank=True)
    grade_id = models.PositiveIntegerField(null=True, blank=True)
    auction_id = models.PositiveIntegerField(null=True, blank=True)
    
    # Metadata adicional (JSON)
    metadata = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-creado']
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        indexes = [
            models.Index(fields=['usuario', 'leida']),
            models.Index(fields=['-creado']),
        ]

    def __str__(self):
        return f"{self.usuario.email} - {self.titulo} ({'Leída' if self.leida else 'No leída'})"

    def marcar_como_leida(self):
        if not self.leida:
            self.leida = True
            self.save(update_fields=['leida'])