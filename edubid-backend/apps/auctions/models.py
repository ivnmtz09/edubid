from django.db import models
from django.conf import settings
from apps.common.models import BaseModel

User = settings.AUTH_USER_MODEL

class Auction(BaseModel):
    ESTADOS = [
        ("active", "Activa"),
        ("closed", "Cerrada"),
    ]

    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    creador = models.ForeignKey(User, on_delete=models.CASCADE, related_name="auctions")
    
    # Relación directa con grupo
    grupo = models.ForeignKey("groups.Group", on_delete=models.CASCADE, related_name="auctions")
    
    estado = models.CharField(max_length=10, choices=ESTADOS, default="active")
    fecha_fin = models.DateTimeField()
    valor_minimo = models.PositiveIntegerField(
    default=1,
    help_text="Valor mínimo para pujar en esta subasta"
    )

    class Meta:
        ordering = ['-creado']

    def __str__(self):
        return f"{self.titulo} - {self.estado} ({self.grupo.nombre})"


class Bid(BaseModel):
    auction = models.ForeignKey(Auction, on_delete=models.CASCADE, related_name="bids")
    estudiante = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bids")
    cantidad = models.PositiveIntegerField()
    
    # Campo para saber quién registró la puja
    registrado_por = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="bids_registradas",
        help_text="Usuario que registró esta puja (estudiante o docente)"
    )

    class Meta:
        # REMOVER unique_together para permitir aumentar pujas
        # unique_together = ('auction', 'estudiante')
        ordering = ['-cantidad']

    def __str__(self):
        return f"{self.estudiante.email} -> {self.cantidad} en {self.auction.titulo}"