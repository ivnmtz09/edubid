import logging

from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.grades.models import Grade
from apps.auctions.models import Auction, Bid
from apps.tokens.models import CoinTransaction
from apps.activities.models import Activity, Submission
from apps.classrooms.models import Classroom
from apps.groups.models import Group
from apps.users.models import User
from apps.users.token_models import LoginFailureTracker
from .models import Notification

logger = logging.getLogger(__name__)


def _institucion_de_usuario(usuario):
    return usuario.institucion_id if usuario and usuario.institucion_id else None


def _institucion_de_actividad(activity):
    try:
        return activity.group.classroom.docente.institucion_id
    except AttributeError:
        return None


# =============================================================================
# FLUJO ESTUDIANTE
# =============================================================================

@receiver(post_save, sender=Grade)
def notificar_calificacion(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        actividad = instance.activity
        coins = instance.calcular_coins_ganados()
        Notification.objects.create(
            usuario=instance.student,
            tipo='calificacion',
            titulo='Nueva calificación recibida',
            mensaje=(
                f'Has recibido una calificación de {instance.nota} en "{actividad.nombre}". '
                f'EduCoins ganados: {coins}.'
            ) if actividad else f'Has recibido una calificación de {instance.nota}. EduCoins ganados: {coins}.',
            institucion_id=_institucion_de_usuario(instance.student),
            grade_id=instance.id,
            activity_id=actividad.id if actividad else None,
            metadata={
                'nota': str(instance.nota),
                'activity_nombre': actividad.nombre if actividad else None,
                'educoins_ganados': coins,
            }
        )
        logger.info("Notificación de calificación enviada a estudiante %s", instance.student.id)
    except Exception as e:
        logger.error("Error creando notificación de calificación: %s", e, exc_info=True)


@receiver(post_save, sender=Auction)
def notificar_nueva_subasta(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        grupo = instance.grupo
        if not grupo:
            return
        estudiantes = grupo.estudiantes.all()
        if not estudiantes:
            return

        try:
            institucion_id = grupo.classroom.docente.institucion_id
        except AttributeError:
            institucion_id = None

        fecha_fin_local = instance.fecha_fin.strftime("%d/%m/%Y %H:%M")
        notificaciones = [
            Notification(
                usuario=estudiante,
                tipo='subasta_nueva',
                titulo='Nueva subasta disponible',
                mensaje=f'¡Nueva subasta en tu grupo! "{instance.titulo}" — Cierra el {fecha_fin_local}. ¡Participa ahora!',
                institucion_id=institucion_id or _institucion_de_usuario(estudiante),
                auction_id=instance.id,
                metadata={
                    'auction_titulo': instance.titulo,
                    'fecha_fin': instance.fecha_fin.isoformat(),
                    'valor_minimo_educoins': instance.valor_minimo_educoins,
                    'grupo_nombre': grupo.nombre,
                }
            )
            for estudiante in estudiantes
        ]
        Notification.objects.bulk_create(notificaciones)
        logger.info("Notificaciones de subasta enviadas a %d estudiante(s) para: %s", len(notificaciones), instance.titulo)
    except Exception as e:
        logger.error("Error creando notificaciones de subasta: %s", e, exc_info=True)


@receiver(post_save, sender=Activity)
def notificar_nueva_actividad(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        grupo = instance.group
        if not grupo:
            return
        estudiantes = grupo.estudiantes.all()
        if not estudiantes:
            return

        institucion_id = _institucion_de_actividad(instance)
        tipo_label = dict(Activity.TIPOS).get(instance.tipo, instance.tipo).capitalize()

        notificaciones = [
            Notification(
                usuario=estudiante,
                tipo='actividad',
                titulo=f'Nueva {tipo_label} asignada',
                mensaje=f'Tu docente ha asignado una nueva actividad: "{instance.nombre}". Fecha de entrega: {instance.fecha_entrega.strftime("%d/%m/%Y %H:%M")}',
                institucion_id=institucion_id or _institucion_de_usuario(estudiante),
                activity_id=instance.id,
                metadata={
                    'activity_nombre': instance.nombre,
                    'activity_tipo': instance.tipo,
                    'fecha_entrega': instance.fecha_entrega.isoformat(),
                    'valor_educoins': instance.valor_educoins,
                    'puntos_experiencia': instance.puntos_experiencia,
                    'grupo_nombre': grupo.nombre,
                }
            )
            for estudiante in estudiantes
        ]
        Notification.objects.bulk_create(notificaciones)
        logger.info("Notificaciones de actividad enviadas a %d estudiante(s) para: %s", len(notificaciones), instance.nombre)
    except Exception as e:
        logger.error("Error creando notificaciones de nueva actividad: %s", e, exc_info=True)


@receiver(post_save, sender=Bid)
def notificar_nueva_puja(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        subasta = instance.auction
        if not subasta:
            return
        grupo = subasta.grupo
        if not grupo:
            return

        estudiante = instance.estudiante
        nombre_pujador = f'{estudiante.first_name} {estudiante.last_name}' if estudiante else 'Alguien'

        classroom = grupo.classroom
        docente = classroom.docente if classroom else None

        institucion_id = _institucion_de_usuario(docente) if docente else None

        if docente:
            Notification.objects.create(
                usuario=docente,
                tipo='subasta_abierta',
                titulo='Nueva puja recibida',
                mensaje=f'{nombre_pujador} ha pujado {instance.cantidad_educoins} EC en "{subasta.titulo}"',
                institucion_id=institucion_id,
                auction_id=subasta.id,
                metadata={
                    'estudiante_nombre': nombre_pujador,
                    'estudiante_email': estudiante.email if estudiante else None,
                    'auction_titulo': subasta.titulo,
                    'cantidad_puja': str(instance.cantidad_educoins),
                    'bid_id': instance.id,
                    'tipo': 'puja_docente',
                }
            )
            logger.info("Notificación de puja enviada a docente %s", docente.email)
        else:
            logger.warning("No se encontró docente para subasta %s", subasta.id)

        if estudiante:
            companeros = grupo.estudiantes.exclude(id=estudiante.id)
        else:
            companeros = grupo.estudiantes.all()
        if companeros:
            notificaciones = [
                Notification(
                    usuario=comp,
                    tipo='subasta_abierta',
                    titulo='Nueva puja en subasta',
                    mensaje=f'{nombre_pujador} ha pujado {instance.cantidad_educoins} EC en "{subasta.titulo}"',
                    institucion_id=_institucion_de_usuario(comp),
                    auction_id=subasta.id,
                    metadata={
                        'estudiante_nombre': nombre_pujador,
                        'auction_titulo': subasta.titulo,
                        'cantidad_puja': str(instance.cantidad_educoins),
                        'bid_id': instance.id,
                        'tipo': 'puja_estudiante',
                    }
                )
                for comp in companeros
            ]
            Notification.objects.bulk_create(notificaciones)
            logger.info("Notificaciones de puja enviadas a %d compañero(s)", len(notificaciones))

    except Exception as e:
        logger.error("Error creando notificación de puja: %s", e, exc_info=True)


# =============================================================================
# FLUJO DOCENTE
# =============================================================================

@receiver(post_save, sender=Submission)
def notificar_entrega_estudiante(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        actividad = instance.activity
        if not actividad:
            return
        grupo = actividad.group
        if not grupo:
            return
        classroom = grupo.classroom
        if not classroom:
            return
        docente = classroom.docente
        if not docente:
            return

        Notification.objects.create(
            usuario=docente,
            tipo='actividad',
            titulo='Nueva entrega recibida',
            mensaje=f'{instance.estudiante.first_name} {instance.estudiante.last_name} ha entregado "{actividad.nombre}"',
            institucion_id=_institucion_de_usuario(docente),
            activity_id=actividad.id,
            metadata={
                'estudiante_nombre': f'{instance.estudiante.first_name} {instance.estudiante.last_name}',
                'estudiante_email': instance.estudiante.email,
                'activity_nombre': actividad.nombre,
                'submission_id': instance.id,
            }
        )
        logger.info("Notificación de entrega enviada a docente %s", docente.email)
    except Exception as e:
        logger.error("Error creando notificación de entrega: %s", e, exc_info=True)


# =============================================================================
# FLUJO SaaS (Coordinadores / Rectores)
# =============================================================================

@receiver(post_save, sender=Classroom)
def notificar_nuevo_classroom(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        institucion_id = _institucion_de_usuario(instance.docente)
        if not institucion_id:
            return

        destinatarios = User.objects.filter(
            institucion_id=institucion_id,
            role__in=['coordinador', 'rector'],
        )
        if not destinatarios:
            return

        notificaciones = [
            Notification(
                usuario=user,
                tipo='novedad_academica',
                titulo='Nuevo classroom creado',
                mensaje=f'Se ha creado un nuevo classroom: "{instance.nombre}" por el docente {instance.docente.get_full_name() or instance.docente.email}.',
                institucion_id=institucion_id,
                metadata={
                    'classroom_id': instance.id,
                    'classroom_nombre': instance.nombre,
                    'docente_email': instance.docente.email,
                }
            )
            for user in destinatarios
        ]
        Notification.objects.bulk_create(notificaciones)
        logger.info("Notificaciones de nuevo classroom enviadas a %d coordinador(es)/rector(es)", len(notificaciones))
    except Exception as e:
        logger.error("Error creando notificación de nuevo classroom: %s", e, exc_info=True)


@receiver(post_save, sender=Group)
def notificar_nuevo_grupo(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        classroom = instance.classroom
        if not classroom:
            return
        institucion_id = _institucion_de_usuario(classroom.docente)
        if not institucion_id:
            return

        destinatarios = User.objects.filter(
            institucion_id=institucion_id,
            role__in=['coordinador', 'rector'],
        )
        if not destinatarios:
            return

        notificaciones = [
            Notification(
                usuario=user,
                tipo='novedad_academica',
                titulo='Nuevo grupo creado',
                mensaje=f'Se ha creado un nuevo grupo: "{instance.nombre}" en el classroom "{classroom.nombre}".',
                institucion_id=institucion_id,
                metadata={
                    'group_id': instance.id,
                    'group_nombre': instance.nombre,
                    'classroom_id': classroom.id,
                    'classroom_nombre': classroom.nombre,
                }
            )
            for user in destinatarios
        ]
        Notification.objects.bulk_create(notificaciones)
        logger.info("Notificaciones de nuevo grupo enviadas a %d coordinador(es)/rector(es)", len(notificaciones))
    except Exception as e:
        logger.error("Error creando notificación de nuevo grupo: %s", e, exc_info=True)


# =============================================================================
# TRANSACCIONES (Monedas)
# =============================================================================

@receiver(post_save, sender=CoinTransaction)
def notificar_monedas_recibidas(sender, instance, created, **kwargs):
    if not (created and instance.tipo == 'earn'):
        return
    try:
        wallet = instance.wallet
        if not wallet:
            return
        Notification.objects.create(
            usuario=wallet.usuario,
            tipo='monedas',
            titulo='EduCoins recibidas',
            mensaje=f'Has recibido {instance.cantidad_educoins} EduCoins. {instance.descripcion}',
            institucion_id=_institucion_de_usuario(wallet.usuario),
            metadata={
                'cantidad_educoins': instance.cantidad_educoins,
                'saldo_nuevo': wallet.saldo_educoins,
            }
        )
        logger.info("Notificación de monedas enviada a usuario %s", wallet.usuario.id)
    except Exception as e:
        logger.error("Error creando notificación de monedas: %s", e, exc_info=True)


# =============================================================================
# SEGURIDAD
# =============================================================================

@receiver(post_save, sender=LoginFailureTracker)
def notificar_intento_login_fallido(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        if LoginFailureTracker.should_suggest_reset(instance.email):
            try:
                user = User.objects.get(email=instance.email)
                Notification.objects.create(
                    usuario=user,
                    tipo='account_security',
                    titulo='Múltiples intentos de inicio de sesión fallidos',
                    mensaje='Hemos detectado varios intentos fallidos de iniciar sesión en tu cuenta. Si no fuiste tú, te recomendamos cambiar tu contraseña inmediatamente.',
                    institucion_id=_institucion_de_usuario(user),
                    metadata={
                        'ip_address': instance.ip_address,
                        'timestamp': instance.attempt_time.isoformat(),
                        'intentos_recientes': LoginFailureTracker.objects.filter(
                            email=instance.email
                        ).count(),
                    }
                )
                logger.warning("Notificación de login fallido enviada a %s", user.email)
            except User.DoesNotExist:
                pass
    except Exception as e:
        logger.error("Error creando notificación de login fallido: %s", e, exc_info=True)
