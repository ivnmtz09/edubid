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

    class Meta:
        verbose_name = 'Institución'
        verbose_name_plural = 'Instituciones'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre
