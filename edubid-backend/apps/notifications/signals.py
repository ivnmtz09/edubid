from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.grades.models import Grade
from apps.auctions.models import Auction, Bid
from apps.tokens.models import CoinTransaction
from apps.activities.models import Activity, Submission
from apps.users.token_models import EmailVerificationToken, LoginFailureTracker
from .models import Notification


# ==========================================
# 📋 SEÑAL: Nueva Actividad creada
# ==========================================

@receiver(post_save, sender=Activity)
def notificar_nueva_actividad(sender, instance, created, **kwargs):
    """Notificar a todos los estudiantes del grupo cuando el docente crea una actividad"""
    if not created:
        return
    try:
        estudiantes = instance.group.estudiantes.all()
        tipo_label = dict(Activity.TIPOS).get(instance.tipo, instance.tipo).capitalize()

        notificaciones = [
            Notification(
                usuario=estudiante,
                tipo='actividad',
                titulo=f'📋 Nueva {tipo_label} asignada',
                mensaje=f'Tu docente ha asignado una nueva actividad: "{instance.nombre}". Fecha de entrega: {instance.fecha_entrega.strftime("%d/%m/%Y %H:%M")}',
                activity_id=instance.id,
                metadata={
                    'activity_nombre': instance.nombre,
                    'activity_tipo': instance.tipo,
                    'fecha_entrega': instance.fecha_entrega.isoformat(),
                    'valor_educoins': instance.valor_educoins,
                    'grupo_nombre': instance.group.nombre,
                }
            )
            for estudiante in estudiantes
        ]

        if notificaciones:
            Notification.objects.bulk_create(notificaciones)
            print(f"✅ Notificaciones de actividad enviadas a {len(notificaciones)} estudiante(s) para: {instance.nombre}")
    except Exception as e:
        print(f"❌ Error creando notificaciones de nueva actividad: {e}")


@receiver(post_save, sender=Grade)
def notificar_calificacion(sender, instance, created, **kwargs):
    """Notificar al estudiante cuando recibe una calificación"""
    if created:
        Notification.objects.create(
            usuario=instance.student,
            tipo='calificacion',
            titulo='Nueva calificación recibida',
            mensaje=f'Has recibido una calificación de {instance.nota} en "{instance.activity.nombre}"',
            grade_id=instance.id,
            activity_id=instance.activity.id,
            metadata={
                'nota': str(instance.nota),
                'activity_nombre': instance.activity.nombre,
                'educoins_ganados': instance.calcular_coins_ganados()
            }
        )


@receiver(post_save, sender=Submission)
def notificar_entrega_estudiante(sender, instance, created, **kwargs):
    """Notificar al docente cuando un estudiante entrega una actividad"""
    if created:
        try:
            # Obtener el docente del grupo
            docente = instance.activity.group.classroom.docente
            
            Notification.objects.create(
                usuario=docente,
                tipo='actividad',
                titulo='Nueva entrega recibida',
                mensaje=f'{instance.estudiante.first_name} {instance.estudiante.last_name} ha entregado "{instance.activity.nombre}"',
                activity_id=instance.activity.id,
                metadata={
                    'estudiante_nombre': f'{instance.estudiante.first_name} {instance.estudiante.last_name}',
                    'estudiante_email': instance.estudiante.email,
                    'activity_nombre': instance.activity.nombre,
                    'submission_id': instance.id
                }
            )
        except Exception as e:
            print(f"Error creando notificación de entrega: {e}")


@receiver(post_save, sender=Auction)
def notificar_nueva_subasta(sender, instance, created, **kwargs):
    """Notificar a los estudiantes del grupo cuando hay una nueva subasta"""
    if not created:
        return
    try:
        grupo = instance.grupo
        estudiantes = grupo.estudiantes.all()

        from django.utils import timezone
        fecha_fin_local = instance.fecha_fin.strftime("%d/%m/%Y %H:%M")

        notificaciones = [
            Notification(
                usuario=estudiante,
                tipo='subasta_nueva',
                titulo='🏆 Nueva subasta disponible',
                mensaje=f'¡Nueva subasta en tu grupo! "{instance.titulo}" — Cierra el {fecha_fin_local}. ¡Participa ahora!',
                auction_id=instance.id,
                metadata={
                    'auction_titulo': instance.titulo,
                    'fecha_fin': instance.fecha_fin.isoformat(),
                    'valor_minimo': str(instance.valor_minimo),
                    'grupo_nombre': grupo.nombre,
                }
            )
            for estudiante in estudiantes
        ]

        if notificaciones:
            Notification.objects.bulk_create(notificaciones)
            print(f"✅ Notificaciones de subasta enviadas a {len(notificaciones)} estudiante(s) para: {instance.titulo}")
    except Exception as e:
        print(f"❌ Error creando notificaciones de subasta: {e}")



@receiver(post_save, sender=Bid)
def notificar_nueva_puja(sender, instance, created, **kwargs):
    """Notificar al docente cuando un estudiante hace una puja"""
    if created:
        try:
            # Obtener el docente del grupo de la subasta
            docente = instance.auction.grupo.classroom.docente
            
            Notification.objects.create(
                usuario=docente,
                tipo='subasta_nueva',
                titulo='Nueva puja recibida',
                mensaje=f'{instance.estudiante.first_name} {instance.estudiante.last_name} ha pujado {instance.cantidad} EC en "{instance.auction.titulo}"',
                auction_id=instance.auction.id,
                metadata={
                    'estudiante_nombre': f'{instance.estudiante.first_name} {instance.estudiante.last_name}',
                    'estudiante_email': instance.estudiante.email,
                    'auction_titulo': instance.auction.titulo,
                    'cantidad_puja': str(instance.cantidad),
                    'bid_id': instance.id
                }
            )
        except Exception as e:
            print(f"Error creando notificación de puja: {e}")


@receiver(post_save, sender=CoinTransaction)
def notificar_monedas_recibidas(sender, instance, created, **kwargs):
    """Notificar cuando un estudiante recibe monedas"""
    if created and instance.tipo == 'earn':
        Notification.objects.create(
            usuario=instance.wallet.usuario,
            tipo='monedas',
            titulo='Educoins recibidas',
            mensaje=f'Has recibido {instance.cantidad} Educoins. {instance.descripcion}',
            metadata={
                'cantidad': instance.cantidad,
                'saldo_nuevo': instance.wallet.saldo
            }
        )


# ==========================================
# 🆕 SEÑALES DE SEGURIDAD Y CUENTA
# ==========================================

@receiver(post_save, sender=LoginFailureTracker)
def notificar_intento_login_fallido(sender, instance, created, **kwargs):
    """Notificar después de 3 intentos fallidos de login"""
    if created:
        try:
            from apps.users.models import User
            
            # Verificar si hay 3+ fallos en las últimas 24 horas
            if LoginFailureTracker.should_suggest_reset(instance.email):
                try:
                    user = User.objects.get(email=instance.email)
                    
                    Notification.objects.create(
                        usuario=user,
                        tipo='account_security',
                        titulo='⚠️ Múltiples intentos de inicio de sesión fallidos',
                        mensaje='Hemos detectado varios intentos fallidos de iniciar sesión en tu cuenta. Si no fuiste tú, te recomendamos cambiar tu contraseña inmediatamente.',
                        metadata={
                            'ip_address': instance.ip_address,
                            'timestamp': instance.attempt_time.isoformat(),
                            'intentos_recientes': LoginFailureTracker.objects.filter(
                                email=instance.email
                            ).count()
                        }
                    )
                except User.DoesNotExist:
                    pass  # Usuario no existe, no crear notificación
        except Exception as e:
            print(f"Error creando notificación de login fallido: {e}")