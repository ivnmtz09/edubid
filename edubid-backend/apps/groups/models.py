from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.common.models import BaseModel
from apps.tokens.models import Period

class Group(BaseModel):
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    classroom = models.ForeignKey("classrooms.Classroom", on_delete=models.CASCADE, related_name="grupos_clases")
    estudiantes = models.ManyToManyField("users.User", related_name="grupos_estudiante", blank=True)
    codigo = models.CharField(max_length=20, unique=True, blank=True, null=True)  # CAMBIO: agregar blank=True, null=True
    activo = models.BooleanField(default=True)
    codigo_generado_en = models.DateTimeField(auto_now_add=True)
    codigo_expira_en = models.DateTimeField()

    def __str__(self):
        return f"{self.nombre} ({self.classroom.nombre})"

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = self.generar_codigo_unico()
        if not self.codigo_expira_en:
            from django.utils import timezone
            self.codigo_expira_en = timezone.now() + timezone.timedelta(days=30)
        super().save(*args, **kwargs)

    def generar_codigo_unico(self):
        import uuid
        return str(uuid.uuid4())[:6].upper()

    class Meta:
        ordering = ['-creado']


@receiver(post_save, sender=Group)
def crear_periodos_al_crear_grupo(sender, instance, created, **kwargs):
    """Crear periodos automaticamente cuando se crea un grupo"""
    if created:
        print(f"Creando periodos para el grupo: {instance.nombre}")
        periodos = Period.crear_periodos_para_grupo(instance)
        print(f"Periodos creados: {len(periodos)} para grupo {instance.nombre}")