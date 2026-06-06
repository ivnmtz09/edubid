import logging

from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.grades.models import Grade
from apps.auctions.models import Auction, Bid
from apps.tokens.models import CoinTransaction
from apps.activities.models import Activity, Submission
from apps.users.token_models import LoginFailureTracker
from .models import Notification

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Activity)
def notificar_nueva_actividad(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        grupo = instance.group
        if not grupo:
            logger.warning("Actividad %s sin grupo asignado, omitiendo notificaciones", instance.id)
            return
        estudiantes = grupo.estudiantes.all()
        if not estudiantes:
            return

        tipo_label = dict(Activity.TIPOS).get(instance.tipo, instance.tipo).capitalize()
        notificaciones = [
            Notification(
                usuario=estudiante,
                tipo='actividad',
                titulo=f'Nueva {tipo_label} asignada',
                mensaje=f'Tu docente ha asignado una nueva actividad: "{instance.nombre}". Fecha de entrega: {instance.fecha_entrega.strftime("%d/%m/%Y %H:%M")}',
                activity_id=instance.id,
                metadata={
                    'activity_nombre': instance.nombre,
                    'activity_tipo': instance.tipo,
                    'fecha_entrega': instance.fecha_entrega.isoformat(),
                    'valor_educoins': instance.valor_educoins,
                    'grupo_nombre': grupo.nombre,
                }
            )
            for estudiante in estudiantes
        ]
        Notification.objects.bulk_create(notificaciones)
        logger.info("Notificaciones de actividad enviadas a %d estudiante(s) para: %s", len(notificaciones), instance.nombre)
    except Exception as e:
        logger.error("Error creando notificaciones de nueva actividad: %s", e, exc_info=True)


@receiver(post_save, sender=Grade)
def notificar_calificacion(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        actividad = instance.activity
        Notification.objects.create(
            usuario=instance.student,
            tipo='calificacion',
            titulo='Nueva calificación recibida',
            mensaje=f'Has recibido una calificación de {instance.nota} en "{actividad.nombre}"' if actividad else f'Has recibido una calificación de {instance.nota}',
            grade_id=instance.id,
            activity_id=actividad.id if actividad else None,
            metadata={
                'nota': str(instance.nota),
                'activity_nombre': actividad.nombre if actividad else None,
                'educoins_ganados': instance.calcular_coins_ganados()
            }
        )
        logger.info("Notificación de calificación enviada a estudiante %s", instance.student.id)
    except Exception as e:
        logger.error("Error creando notificación de calificación: %s", e, exc_info=True)


@receiver(post_save, sender=Submission)
def notificar_entrega_estudiante(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        actividad = instance.activity
        if not actividad:
            logger.warning("Submission %s sin actividad asociada", instance.id)
            return
        grupo = actividad.group
        if not grupo:
            logger.warning("Actividad %s sin grupo asociado", actividad.id)
            return
        classroom = grupo.classroom
        if not classroom:
            logger.warning("Grupo %s sin classroom asociado", grupo.id)
            return
        docente = classroom.docente
        if not docente:
            logger.warning("Classroom %s sin docente asignado", classroom.id)
            return

        Notification.objects.create(
            usuario=docente,
            tipo='actividad',
            titulo='Nueva entrega recibida',
            mensaje=f'{instance.estudiante.first_name} {instance.estudiante.last_name} ha entregado "{actividad.nombre}"',
            activity_id=actividad.id,
            metadata={
                'estudiante_nombre': f'{instance.estudiante.first_name} {instance.estudiante.last_name}',
                'estudiante_email': instance.estudiante.email,
                'activity_nombre': actividad.nombre,
                'submission_id': instance.id
            }
        )
        logger.info("Notificación de entrega enviada a docente %s", docente.email)
    except Exception as e:
        logger.error("Error creando notificación de entrega: %s", e, exc_info=True)


@receiver(post_save, sender=Auction)
def notificar_nueva_subasta(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        grupo = instance.grupo
        if not grupo:
            logger.warning("Subasta %s sin grupo asignado, omitiendo notificaciones", instance.id)
            return
        estudiantes = grupo.estudiantes.all()
        if not estudiantes:
            return

        fecha_fin_local = instance.fecha_fin.strftime("%d/%m/%Y %H:%M")
        notificaciones = [
            Notification(
                usuario=estudiante,
                tipo='subasta_nueva',
                titulo='Nueva subasta disponible',
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
        Notification.objects.bulk_create(notificaciones)
        logger.info("Notificaciones de subasta enviadas a %d estudiante(s) para: %s", len(notificaciones), instance.titulo)
    except Exception as e:
        logger.error("Error creando notificaciones de subasta: %s", e, exc_info=True)


@receiver(post_save, sender=Bid)
def notificar_nueva_puja(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        subasta = instance.auction
        if not subasta:
            logger.warning("Puja %s sin subasta asociada", instance.id)
            return
        grupo = subasta.grupo
        if not grupo:
            logger.warning("Subasta %s sin grupo asociado", subasta.id)
            return

        estudiante = instance.estudiante
        nombre_pujador = f'{estudiante.first_name} {estudiante.last_name}' if estudiante else 'Alguien'

        # 1. Notificar al docente
        classroom = grupo.classroom
        docente = classroom.docente if classroom else None
        if docente:
            Notification.objects.create(
                usuario=docente,
                tipo='subasta_nueva',
                titulo='Nueva puja recibida',
                mensaje=f'{nombre_pujador} ha pujado {instance.cantidad} EC en "{subasta.titulo}"',
                auction_id=subasta.id,
                metadata={
                    'estudiante_nombre': nombre_pujador,
                    'estudiante_email': estudiante.email if estudiante else None,
                    'auction_titulo': subasta.titulo,
                    'cantidad_puja': str(instance.cantidad),
                    'bid_id': instance.id,
                    'tipo': 'puja_docente'
                }
            )
            logger.info("Notificación de puja enviada a docente %s", docente.email)
        else:
            logger.warning("No se encontró docente para subasta %s", subasta.id)

        # 2. Notificar a los demás estudiantes del grupo
        if estudiante:
            companeros = grupo.estudiantes.exclude(id=estudiante.id)
        else:
            companeros = grupo.estudiantes.all()
        if companeros:
            notificaciones = [
                Notification(
                    usuario=comp,
                    tipo='subasta_nueva',
                    titulo='Nueva puja en subasta',
                    mensaje=f'{nombre_pujador} ha pujado {instance.cantidad} EC en "{subasta.titulo}"',
                    auction_id=subasta.id,
                    metadata={
                        'estudiante_nombre': nombre_pujador,
                        'auction_titulo': subasta.titulo,
                        'cantidad_puja': str(instance.cantidad),
                        'bid_id': instance.id,
                        'tipo': 'puja_estudiante'
                    }
                )
                for comp in companeros
            ]
            Notification.objects.bulk_create(notificaciones)
            logger.info("Notificaciones de puja enviadas a %d compañero(s)", len(notificaciones))

    except Exception as e:
        logger.error("Error creando notificación de puja: %s", e, exc_info=True)


@receiver(post_save, sender=CoinTransaction)
def notificar_monedas_recibidas(sender, instance, created, **kwargs):
    if not (created and instance.tipo == 'earn'):
        return
    try:
        wallet = instance.wallet
        if not wallet:
            logger.warning("CoinTransaction %s sin wallet asociada", instance.id)
            return
        Notification.objects.create(
            usuario=wallet.usuario,
            tipo='monedas',
            titulo='Educoins recibidas',
            mensaje=f'Has recibido {instance.cantidad} Educoins. {instance.descripcion}',
            metadata={
                'cantidad': instance.cantidad,
                'saldo_nuevo': wallet.saldo
            }
        )
        logger.info("Notificación de monedas enviada a usuario %s", wallet.usuario.id)
    except Exception as e:
        logger.error("Error creando notificación de monedas: %s", e, exc_info=True)


@receiver(post_save, sender=LoginFailureTracker)
def notificar_intento_login_fallido(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        from apps.users.models import User

        if LoginFailureTracker.should_suggest_reset(instance.email):
            try:
                user = User.objects.get(email=instance.email)
                Notification.objects.create(
                    usuario=user,
                    tipo='account_security',
                    titulo='Múltiples intentos de inicio de sesión fallidos',
                    mensaje='Hemos detectado varios intentos fallidos de iniciar sesión en tu cuenta. Si no fuiste tú, te recomendamos cambiar tu contraseña inmediatamente.',
                    metadata={
                        'ip_address': instance.ip_address,
                        'timestamp': instance.attempt_time.isoformat(),
                        'intentos_recientes': LoginFailureTracker.objects.filter(
                            email=instance.email
                        ).count()
                    }
                )
                logger.warning("Notificación de login fallido enviada a %s", user.email)
            except User.DoesNotExist:
                pass
    except Exception as e:
        logger.error("Error creando notificación de login fallido: %s", e, exc_info=True)