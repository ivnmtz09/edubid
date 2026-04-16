from django.db import models
from apps.groups.models import Group
from apps.common.models import BaseModel

class Activity(BaseModel):
    TIPOS = [
        ('tarea', 'Tarea'),
        ('examen', 'Examen'),
        ('proyecto', 'Proyecto'),
        ('quiz', 'Quiz'),
        ('exposicion', 'Exposición'),
    ]

    group = models.ForeignKey("groups.Group", on_delete=models.CASCADE, related_name='activities')
    tipo = models.CharField(max_length=20, choices=TIPOS)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    valor_educoins = models.PositiveIntegerField(default=100)
    valor_notas = models.PositiveIntegerField(default=10)  # Cambiado a 10 por defecto
    fecha_entrega = models.DateTimeField()
    habilitada = models.BooleanField(default=True)
    
    # Archivos adjuntos del docente
    archivo_adjunto = models.FileField(
        upload_to='activities/attachments/', 
        null=True, 
        blank=True,
        help_text="Archivo que el docente adjunta a la actividad"
    )

    class Meta:
        ordering = ['-fecha_entrega']
        verbose_name = 'Actividad'
        verbose_name_plural = 'Actividades'

    def __str__(self):
        return f"{self.nombre} ({self.group.nombre})"

    def esta_vencida(self):
        """Verifica si la actividad ya pasó su fecha y hora límite"""
        from django.utils import timezone
        return timezone.now() > self.fecha_entrega

    def puede_entregar(self):
        """Verifica si un estudiante puede entregar esta actividad"""
        return self.habilitada and not self.esta_vencida()


class Submission(BaseModel):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='submissions')
    estudiante = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='submissions')
    contenido = models.TextField(blank=True)
    archivo = models.FileField(upload_to='submissions/', null=True, blank=True)
    calificacion = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    retroalimentacion = models.TextField(blank=True)

    def __str__(self):
        return f"Submission by {self.estudiante.email} for {self.activity.nombre}"

    class Meta:
        unique_together = ('activity', 'estudiante')
        ordering = ['-creado']
        verbose_name = 'Entrega'
        verbose_name_plural = 'Entregas'