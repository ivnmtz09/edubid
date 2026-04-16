from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal
from django.conf import settings
from apps.common.models import BaseModel
from apps.activities.models import Activity
from apps.tokens.models import Wallet, Period
from apps.users.models import User


class Grade(BaseModel):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='grades')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='grades')
    nota = models.DecimalField(max_digits=5, decimal_places=2)
    retroalimentacion = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('activity', 'student')
        ordering = ['-creado']

    def __str__(self):
        return f"{self.student.email} - {self.activity.nombre}: {self.nota}"

    @property
    def grupo(self):
        return self.activity.group

    @property
    def periodo(self):
        return Period.objects.filter(grupo=self.grupo, activo=True).first()

    def calcular_coins_ganados(self):
        """Calcular coins basado en la nota y valor_educoins de la actividad"""
        # Obtener el valor máximo de notas de la actividad
        valor_maximo_notas = Decimal(self.activity.valor_notas)
        valor_educoins = Decimal(self.activity.valor_educoins)
        
        # Calcular porcentaje basado en la nota obtenida vs valor máximo
        if valor_maximo_notas > 0:
            porcentaje = Decimal(self.nota) / valor_maximo_notas
        else:
            porcentaje = Decimal(0)
        
        # Aplicar el porcentaje al valor de educoins
        coins_base = int(porcentaje * valor_educoins)
        
        # Bonus del 10% si nota es igual o mayor al 90% del máximo
        nota_para_bonus = valor_maximo_notas * Decimal(0.9)
        if Decimal(self.nota) >= nota_para_bonus:
            bonus = int(coins_base * Decimal(0.1))
            coins_base += bonus
            print(f"Bonus aplicado: +{bonus} Educoins")
            
        return max(0, coins_base)  # Asegurar que no sea negativo

    def aplicar_recompensa(self):
        """Aplicar recompensa de coins a la wallet EXISTENTE del estudiante"""
        periodo_actual = self.periodo
        if not periodo_actual:
            print(f"No hay periodo activo para el grupo {self.grupo}")
            return 0

        try:
            # BUSCAR WALLET EXISTENTE, NO CREAR NUEVA
            wallet = Wallet.objects.get(
                usuario=self.student,
                grupo=self.grupo,
                periodo=periodo_actual
            )
            
            coins = self.calcular_coins_ganados()
            if coins > 0:
                wallet.depositar(coins, f"Recompensa por '{self.activity.nombre}' (nota {self.nota}/{self.activity.valor_notas})")
                print(f"{coins} Educoins asignados a {self.student.email} en wallet existente")
                print(f"Detalle: Nota {self.nota}/{self.activity.valor_notas} = {coins}/{self.activity.valor_educoins} Educoins")
                return coins
            else:
                print(f"Nota {self.nota} no genera Educoins para {self.student.email}")
                return 0
                
        except Wallet.DoesNotExist:
            print(f"ERROR: No se encontro wallet para {self.student.email} en grupo {self.grupo.nombre}")
            # NO CREAR WALLET AQUI - debe crearse al unirse al grupo
            return 0


@receiver(post_save, sender=Grade)
def asignar_educoins(sender, instance, created, **kwargs):
    """Signal para asignar Educoins automaticamente al crear una calificacion"""
    if created:
        coins_ganados = instance.aplicar_recompensa()
        if coins_ganados > 0:
            print(f"Signal: {coins_ganados} Educoins asignados a {instance.student.email}")