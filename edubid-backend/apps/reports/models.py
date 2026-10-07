from django.db import models
from django.conf import settings


class UserReport(models.Model):
    TIPO_CHOICES = [
        ('bug', 'Error o fallo del sistema'),
        ('sugerencia', 'Sugerencia o mejora'),
        ('educoins', 'Problema con EduCoins / Subastas'),
        ('academico', 'Dificultad con actividades / notas'),
        ('otro', 'Otro asunto'),
    ]

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_revision', 'En revisión'),
        ('resuelto', 'Resuelto'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reportes',
        verbose_name='Usuario'
    )
    email_contacto = models.EmailField(
        blank=True,
        null=True,
        verbose_name='Email de contacto'
    )
    nombre_contacto = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Nombre de contacto'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        default='bug',
        verbose_name='Tipo de reporte'
    )
    asunto = models.CharField(
        max_length=200,
        verbose_name='Asunto'
    )
    descripcion = models.TextField(
        verbose_name='Descripción'
    )
    pagina_origen = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        verbose_name='Página de origen'
    )
    navegador_info = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        verbose_name='Información de navegador/dispositivo'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente',
        verbose_name='Estado'
    )
    creado = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    class Meta:
        verbose_name = 'Reporte de Usuario'
        verbose_name_plural = 'Reportes de Usuarios'
        ordering = ['-creado']

    def __str__(self):
        return f"[{self.get_tipo_display()}] {self.asunto} ({self.get_estado_display()})"
