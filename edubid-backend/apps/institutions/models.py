from django.db import models
from apps.common.models import BaseModel


class Institution(BaseModel):
    nombre = models.CharField(max_length=255, verbose_name='Nombre de la institución')
    codigo_dane = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        verbose_name='Código DANE',
        help_text='Código único de identificación de la institución (DANE u otro)'
    )
    activo = models.BooleanField(default=True, verbose_name='Institución activa')

    # ─────────────────────────────────────────────
    # White-Label / Personalización
    # ─────────────────────────────────────────────
    color_primario = models.CharField(
        max_length=7,
        default='#f97316',
        verbose_name='Color primario',
        help_text='Color corporativo principal en formato hexadecimal (ej. #f97316)'
    )
    color_secundario = models.CharField(
        max_length=7,
        default='#3b82f6',
        verbose_name='Color secundario',
        help_text='Color corporativo secundario en formato hexadecimal (ej. #3b82f6)'
    )
    logo = models.ImageField(
        upload_to='instituciones/logos/',
        null=True,
        blank=True,
        verbose_name='Logo institucional'
    )

    class Meta:
        verbose_name = 'Institución'
        verbose_name_plural = 'Instituciones'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre
