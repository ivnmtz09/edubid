from django.db import models
from django.conf import settings
from apps.common.models import BaseModel

User = settings.AUTH_USER_MODEL

class Classroom(BaseModel):
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    docente = models.ForeignKey(User, on_delete=models.CASCADE, related_name='classrooms_docente')

    class Meta:
        verbose_name = 'Classroom'
        verbose_name_plural = 'Classrooms'

    def __str__(self):
        return self.nombre
