import logging
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.db.models import Count, Q

from apps.classrooms.models import Classroom
from apps.groups.models import Group
from apps.activities.models import Activity, Submission
from apps.auctions.models import Auction, Bid
from apps.tokens.models import Period, Wallet, CoinTransaction
from apps.users.models import User

logger = logging.getLogger(__name__)

# Definiciones de herramientas para OpenAI / OpenRouter Tool Calling
AI_TOOLS_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_my_classrooms_and_groups",
            "description": "Consulta las asignaturas (aulas/classrooms) y grupos que tiene a cargo el docente o la institución. Muestra nombres, códigos de acceso y cantidad de estudiantes.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_classroom_students",
            "description": "Obtiene la lista de estudiantes inscritos en un grupo específico, incluyendo sus nombres, correos y saldo actual de EduCoins.",
            "parameters": {
                "type": "object",
                "properties": {
                    "grupo_id": {
                        "type": "integer",
                        "description": "ID del grupo a consultar."
                    }
                },
                "required": ["grupo_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_activities",
            "description": "Lista las actividades académicas (tareas, talleres, evaluaciones) creadas en un grupo o en todas las clases del docente.",
            "parameters": {
                "type": "object",
                "properties": {
                    "grupo_id": {
                        "type": "integer",
                        "description": "Opcional: ID del grupo para filtrar las actividades."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_activity",
            "description": "Crea una nueva actividad pedagógica (tarea, proyecto, evaluación o examen) dentro de un grupo con recompensa en EduCoins.",
            "parameters": {
                "type": "object",
                "properties": {
                    "grupo_id": {
                        "type": "integer",
                        "description": "ID del grupo donde se publicará la actividad."
                    },
                    "nombre": {
                        "type": "string",
                        "description": "Título claro de la actividad."
                    },
                    "tipo": {
                        "type": "string",
                        "enum": ["tarea", "proyecto", "evaluacion", "examen"],
                        "description": "Tipo de actividad pedagógica."
                    },
                    "descripcion": {
                        "type": "string",
                        "description": "Instrucciones detalladas de la actividad o rúbrica resumida."
                    },
                    "valor_educoins": {
                        "type": "integer",
                        "description": "Recompensa en EduCoins que ganará el estudiante al aprobarla (ej: 50, 100, 200)."
                    },
                    "dias_para_entrega": {
                        "type": "integer",
                        "description": "Cantidad de días a partir de hoy para la fecha límite de entrega (por defecto 7 días si no se especifica)."
                    }
                },
                "required": ["grupo_id", "nombre", "tipo"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_submissions_to_grade",
            "description": "Obtiene las entregas de estudiantes pendientes de calificación o ya calificadas para una actividad.",
            "parameters": {
                "type": "object",
                "properties": {
                    "activity_id": {
                        "type": "integer",
                        "description": "ID de la actividad de la cual revisar las entregas."
                    }
                },
                "required": ["activity_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "grade_submission",
            "description": "Califica una entrega de un estudiante (escala 0.0 a 5.0) y agrega retroalimentación pedagógica. Si la nota es aprobatoria (>= 3.0), le abona automáticamente los EduCoins a la billetera del estudiante.",
            "parameters": {
                "type": "object",
                "properties": {
                    "submission_id": {
                        "type": "integer",
                        "description": "ID de la entrega a calificar."
                    },
                    "calificacion": {
                        "type": "number",
                        "description": "Nota numérica en escala colombiana de 0.0 a 5.0 (ej: 4.5, 3.8)."
                    },
                    "retroalimentacion": {
                        "type": "string",
                        "description": "Comentarios pedagógicos y de mejora para el estudiante."
                    }
                },
                "required": ["submission_id", "calificacion"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_auctions",
            "description": "Consulta las subastas (activas o cerradas) del docente o del grupo, mostrando pujas líderes y tiempo restante.",
            "parameters": {
                "type": "object",
                "properties": {
                    "grupo_id": {
                        "type": "integer",
                        "description": "Opcional: ID del grupo para filtrar las subastas."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_auction",
            "description": "Crea una subasta pedagógica en un grupo con incentivos (ej: '1 punto extra', 'Elegir equipo', etc.).",
            "parameters": {
                "type": "object",
                "properties": {
                    "grupo_id": {
                        "type": "integer",
                        "description": "ID del grupo donde se abre la subasta."
                    },
                    "titulo": {
                        "type": "string",
                        "description": "Nombre del incentivo o recompensa a subastar."
                    },
                    "descripcion": {
                        "type": "string",
                        "description": "Términos y condiciones o descripción de la recompensa."
                    },
                    "valor_minimo_educoins": {
                        "type": "integer",
                        "description": "Puja inicial mínima en EduCoins (por defecto 10)."
                    },
                    "dias_duracion": {
                        "type": "integer",
                        "description": "Duración de la subasta en días a partir de hoy (por defecto 3)."
                    }
                },
                "required": ["grupo_id", "titulo"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "award_educoins",
            "description": "Otorga EduCoins directamente a un estudiante por participación, mérito, trabajo en equipo o puntualidad.",
            "parameters": {
                "type": "object",
                "properties": {
                    "grupo_id": {
                        "type": "integer",
                        "description": "ID del grupo al que pertenece el estudiante."
                    },
                    "estudiante_identificador": {
                        "type": "string",
                        "description": "Correo electrónico o ID numérico del estudiante a premiar."
                    },
                    "cantidad": {
                        "type": "integer",
                        "description": "Cantidad de EduCoins a depositar (ej: 25, 50, 100)."
                    },
                    "motivo": {
                        "type": "string",
                        "description": "Explicación breve del mérito o razón del abono."
                    }
                },
                "required": ["grupo_id", "estudiante_identificador", "cantidad"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_institution_summary",
            "description": "Genera un reporte institucional consolidado para Directivos (Rector o Coordinador) con totales de estudiantes, docentes, aulas, grupos y subastas.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    }
]


# =====================================================================
# EJECUTORES DE HERRAMIENTAS
# =====================================================================

def execute_get_my_classrooms_and_groups(user, args):
    """Retorna las asignaturas y grupos del usuario según su rol."""
    if user.role == 'docente':
        classrooms = Classroom.objects.filter(docente=user).prefetch_related('grupos_clases', 'grupos_clases__estudiantes')
    elif user.role in ['rector', 'coordinador'] and user.institucion_id:
        docentes_inst = User.objects.filter(institucion_id=user.institucion_id, role='docente')
        classrooms = Classroom.objects.filter(docente__in=docentes_inst).prefetch_related('grupos_clases', 'grupos_clases__estudiantes')
    else:  # Admin
        classrooms = Classroom.objects.all()[:20].prefetch_related('grupos_clases', 'grupos_clases__estudiantes')

    data = []
    total_grupos = 0
    total_estudiantes_unicos = set()

    for c in classrooms:
        grupos_data = []
        for g in c.grupos_clases.filter(activo=True):
            count_est = g.estudiantes.count()
            total_grupos += 1
            for est_id in g.estudiantes.values_list('id', flat=True):
                total_estudiantes_unicos.add(est_id)

            grupos_data.append({
                "id": g.id,
                "nombre": g.nombre,
                "codigo_acceso": g.codigo,
                "estudiantes_inscritos": count_est
            })

        data.append({
            "id": c.id,
            "asignatura": c.nombre,
            "descripcion": c.descripcion or "",
            "docente": f"{c.docente.first_name} {c.docente.last_name}".strip() if c.docente else "No asignado",
            "grupos": grupos_data
        })

    return {
        "total_asignaturas": len(data),
        "total_grupos": total_grupos,
        "total_estudiantes_impactados": len(total_estudiantes_unicos),
        "asignaturas": data
    }


def execute_get_classroom_students(user, args):
    """Retorna los estudiantes de un grupo y sus saldos de EduCoins."""
    grupo_id = args.get('grupo_id')
    try:
        grupo = Group.objects.get(id=grupo_id)
    except Group.DoesNotExist:
        return {"error": f"No se encontró el grupo con ID {grupo_id}."}

    # Verificar permisos
    if user.role == 'docente' and grupo.classroom.docente_id != user.id:
        return {"error": "No tienes permiso para ver los estudiantes de este grupo."}

    # Periodo activo para buscar billeteras
    periodo_activo = Period.objects.filter(grupo=grupo, activo=True).first()

    estudiantes = []
    for est in grupo.estudiantes.all().order_by('last_name', 'first_name'):
        saldo = 0
        if periodo_activo:
            wallet = Wallet.objects.filter(usuario=est, grupo=grupo, periodo=periodo_activo).first()
            if wallet:
                saldo = wallet.saldo_educoins

        estudiantes.append({
            "id": est.id,
            "nombre_completo": f"{est.first_name} {est.last_name}".strip() or est.email,
            "email": est.email,
            "saldo_educoins": saldo
        })

    return {
        "grupo_id": grupo.id,
        "grupo_nombre": grupo.nombre,
        "asignatura": grupo.classroom.nombre,
        "total_estudiantes": len(estudiantes),
        "estudiantes": estudiantes
    }


def execute_get_activities(user, args):
    """Lista actividades creadas en un grupo o en las clases del docente."""
    grupo_id = args.get('grupo_id')
    qs = Activity.objects.all().select_related('group', 'group__classroom')

    if grupo_id:
        qs = qs.filter(group_id=grupo_id)
    elif user.role == 'docente':
        qs = qs.filter(group__classroom__docente=user)
    elif user.role in ['rector', 'coordinador'] and user.institucion_id:
        qs = qs.filter(group__classroom__docente__institucion_id=user.institucion_id)

    activities_data = []
    for act in qs.order_by('-fecha_entrega')[:20]:
        total_sub = act.submissions.count()
        calificadas = act.submissions.filter(calificacion__isnull=False).count()
        pendientes = total_sub - calificadas

        activities_data.append({
            "id": act.id,
            "nombre": act.nombre,
            "tipo": act.tipo,
            "grupo": f"{act.group.nombre} ({act.group.classroom.nombre})",
            "valor_educoins": act.valor_educoins,
            "fecha_entrega": act.fecha_entrega.strftime('%Y-%m-%d %H:%M') if act.fecha_entrega else "",
            "entregas_totales": total_sub,
            "entregas_pendientes": pendientes,
            "esta_vencida": act.esta_vencida()
        })

    return {
        "total": len(activities_data),
        "actividades": activities_data
    }


def execute_create_activity(user, args):
    """Crea una nueva actividad pedagógica en el grupo."""
    grupo_id = args.get('grupo_id')
    nombre = args.get('nombre', '').strip()
    tipo = args.get('tipo', 'tarea')
    descripcion = args.get('descripcion', '')
    valor_educoins = args.get('valor_educoins', 100)
    dias = args.get('dias_para_entrega', 7)

    try:
        grupo = Group.objects.get(id=grupo_id)
    except Group.DoesNotExist:
        return {"error": f"No existe ningún grupo con el ID {grupo_id}."}

    if user.role == 'docente' and grupo.classroom.docente_id != user.id:
        return {"error": "Solo el docente asignado puede crear actividades en este grupo."}

    fecha_limite = timezone.now() + timedelta(days=dias)

    act = Activity.objects.create(
        group=grupo,
        nombre=nombre,
        tipo=tipo,
        descripcion=descripcion,
        valor_educoins=max(0, int(valor_educoins)),
        puntos_experiencia=10,
        fecha_entrega=fecha_limite,
        habilitada=True
    )

    return {
        "status": "success",
        "mensaje": f"Actividad '{act.nombre}' creada con éxito en el grupo {grupo.nombre}.",
        "actividad": {
            "id": act.id,
            "nombre": act.nombre,
            "tipo": act.tipo,
            "grupo": grupo.nombre,
            "asignatura": grupo.classroom.nombre,
            "valor_educoins": act.valor_educoins,
            "fecha_entrega": act.fecha_entrega.strftime('%Y-%m-%d %H:%M')
        }
    }


def execute_get_submissions_to_grade(user, args):
    """Lista las entregas de una actividad para calificar."""
    activity_id = args.get('activity_id')
    try:
        act = Activity.objects.select_related('group', 'group__classroom').get(id=activity_id)
    except Activity.DoesNotExist:
        return {"error": f"No se encontró la actividad con ID {activity_id}."}

    if user.role == 'docente' and act.group.classroom.docente_id != user.id:
        return {"error": "No tienes permiso para revisar las entregas de esta actividad."}

    submissions_data = []
    for sub in act.submissions.all().select_related('estudiante').order_by('calificacion', '-creado'):
        submissions_data.append({
            "id": sub.id,
            "estudiante": f"{sub.estudiante.first_name} {sub.estudiante.last_name}".strip() or sub.estudiante.email,
            "email": sub.estudiante.email,
            "calificacion": float(sub.calificacion) if sub.calificacion is not None else None,
            "estado": "Calificado" if sub.calificacion is not None else "Pendiente por calificar",
            "retroalimentacion": sub.retroalimentacion or "",
            "tiene_archivo": bool(sub.archivo),
            "contenido_texto": sub.contenido[:200] if sub.contenido else ""
        })

    return {
        "actividad_id": act.id,
        "actividad_nombre": act.nombre,
        "grupo": act.group.nombre,
        "total_entregas": len(submissions_data),
        "entregas": submissions_data
    }


def execute_grade_submission(user, args):
    """Califica una entrega y si aprueba le entrega los EduCoins."""
    submission_id = args.get('submission_id')
    calificacion_val = args.get('calificacion')
    retroalimentacion = args.get('retroalimentacion', '')

    try:
        sub = Submission.objects.select_related('activity', 'activity__group', 'activity__group__classroom', 'estudiante').get(id=submission_id)
    except Submission.DoesNotExist:
        return {"error": f"No se encontró la entrega con ID {submission_id}."}

    act = sub.activity
    if user.role == 'docente' and act.group.classroom.docente_id != user.id:
        return {"error": "No tienes permiso para calificar esta entrega."}

    try:
        nota = Decimal(str(calificacion_val)).quantize(Decimal('0.01'))
    except Exception:
        return {"error": "Formato de calificación inválido. Debe ser un número (ej: 4.5)."}

    sub.calificacion = nota
    sub.retroalimentacion = retroalimentacion
    sub.save()

    # Si la nota es aprobatoria (>= 3.0), abonar EduCoins si la actividad los tiene configurados
    educoins_abonados = 0
    if nota >= Decimal('3.0') and act.valor_educoins > 0:
        periodo = Period.objects.filter(grupo=act.group, activo=True).first()
        if not periodo:
            periodos = Period.crear_periodos_para_grupo(act.group)
            periodo = periodos[0] if periodos else None

        if periodo:
            wallet, _ = Wallet.objects.get_or_create(
                usuario=sub.estudiante,
                grupo=act.group,
                periodo=periodo,
                defaults={"saldo_educoins": 0}
            )
            wallet.depositar(
                act.valor_educoins,
                descripcion=f"Aprobación de actividad: {act.nombre} (Nota: {nota})"
            )
            educoins_abonados = act.valor_educoins

    return {
        "status": "success",
        "mensaje": f"Entrega de {sub.estudiante.email} calificada con {nota}/5.0.",
        "calificacion": float(nota),
        "retroalimentacion": sub.retroalimentacion,
        "educoins_recompensados": educoins_abonados
    }


def execute_get_auctions(user, args):
    """Lista las subastas pedagógicas activas o cerradas."""
    grupo_id = args.get('grupo_id')
    qs = Auction.objects.all().select_related('grupo', 'grupo__classroom')

    if grupo_id:
        qs = qs.filter(grupo_id=grupo_id)
    elif user.role == 'docente':
        qs = qs.filter(creador=user)
    elif user.role in ['rector', 'coordinador'] and user.institucion_id:
        qs = qs.filter(creador__institucion_id=user.institucion_id)

    auctions_data = []
    for auc in qs.order_by('-creado')[:15]:
        top_bid = auc.bids.first()
        auctions_data.append({
            "id": auc.id,
            "titulo": auc.titulo,
            "descripcion": auc.descripcion or "",
            "grupo": auc.grupo.nombre,
            "estado": auc.estado,
            "valor_minimo_educoins": auc.valor_minimo_educoins,
            "puja_actual_maxima": top_bid.cantidad_educoins if top_bid else 0,
            "lider_puja": top_bid.estudiante.email if top_bid else "Sin pujas",
            "fecha_fin": auc.fecha_fin.strftime('%Y-%m-%d %H:%M') if auc.fecha_fin else ""
        })

    return {
        "total": len(auctions_data),
        "subastas": auctions_data
    }


def execute_create_auction(user, args):
    """Crea una subasta pedagógica en el grupo."""
    grupo_id = args.get('grupo_id')
    titulo = args.get('titulo', '').strip()
    descripcion = args.get('descripcion', '')
    valor_min = args.get('valor_minimo_educoins', 10)
    dias = args.get('dias_duracion', 3)

    try:
        grupo = Group.objects.get(id=grupo_id)
    except Group.DoesNotExist:
        return {"error": f"No se encontró el grupo con ID {grupo_id}."}

    if user.role == 'docente' and grupo.classroom.docente_id != user.id:
        return {"error": "Solo el docente de la clase puede abrir subastas en este grupo."}

    fecha_cierre = timezone.now() + timedelta(days=dias)

    auc = Auction.objects.create(
        titulo=titulo,
        descripcion=descripcion,
        creador=user,
        grupo=grupo,
        estado="active",
        fecha_fin=fecha_cierre,
        valor_minimo_educoins=max(1, int(valor_min)),
        incremento_minimo_educoins=5
    )

    return {
        "status": "success",
        "mensaje": f"Subasta '{auc.titulo}' creada con éxito en {grupo.nombre}.",
        "subasta": {
            "id": auc.id,
            "titulo": auc.titulo,
            "grupo": grupo.nombre,
            "valor_minimo": auc.valor_minimo_educoins,
            "fecha_fin": auc.fecha_fin.strftime('%Y-%m-%d %H:%M')
        }
    }


def execute_award_educoins(user, args):
    """Deposita EduCoins a un estudiante por mérito o participación."""
    grupo_id = args.get('grupo_id')
    identificador = str(args.get('estudiante_identificador', '')).strip()
    cantidad = int(args.get('cantidad', 0))
    motivo = args.get('motivo', 'Bonificación del docente')

    if cantidad <= 0:
        return {"error": "La cantidad de EduCoins debe ser mayor a 0."}

    try:
        grupo = Group.objects.get(id=grupo_id)
    except Group.DoesNotExist:
        return {"error": f"No existe el grupo con ID {grupo_id}."}

    if user.role == 'docente' and grupo.classroom.docente_id != user.id:
        return {"error": "Solo el docente del grupo puede otorgar EduCoins."}

    # Buscar estudiante por ID o por Email
    estudiante = None
    if identificador.isdigit():
        estudiante = User.objects.filter(id=int(identificador)).first()
    if not estudiante:
        estudiante = User.objects.filter(email__iexact=identificador).first()

    if not estudiante:
        return {"error": f"No se encontró al estudiante '{identificador}'."}

    periodo = Period.objects.filter(grupo=grupo, activo=True).first()
    if not periodo:
        periodos = Period.crear_periodos_para_grupo(grupo)
        periodo = periodos[0]

    wallet, _ = Wallet.objects.get_or_create(
        usuario=estudiante,
        grupo=grupo,
        periodo=periodo,
        defaults={"saldo_educoins": 0}
    )

    wallet.depositar(cantidad, descripcion=f"Asignado por {user.first_name}: {motivo}")

    return {
        "status": "success",
        "mensaje": f"Se han abonado {cantidad} EduCoins a {estudiante.first_name} {estudiante.last_name} ({estudiante.email}).",
        "nuevo_saldo": wallet.saldo_educoins,
        "motivo": motivo
    }


def execute_get_institution_summary(user, args):
    """Genera reporte institucional consolidado para Directivos."""
    inst_id = user.institucion_id
    if not inst_id and not user.is_superuser:
        return {"error": "El usuario no tiene una institución asignada."}

    filtro_user = Q(institucion_id=inst_id) if inst_id else Q()
    docentes_count = User.objects.filter(filtro_user, role='docente').count()
    estudiantes_count = User.objects.filter(filtro_user, role='estudiante').count()
    coordinadores_count = User.objects.filter(filtro_user, role='coordinador').count()

    filtro_doc = Q(docente__institucion_id=inst_id) if inst_id else Q()
    aulas_count = Classroom.objects.filter(filtro_doc).count()
    grupos_count = Group.objects.filter(classroom__docente__institucion_id=inst_id).count() if inst_id else Group.objects.count()

    actividades_count = Activity.objects.filter(group__classroom__docente__institucion_id=inst_id).count() if inst_id else Activity.objects.count()
    subastas_activas = Auction.objects.filter(estado='active', creador__institucion_id=inst_id).count() if inst_id else Auction.objects.filter(estado='active').count()

    return {
        "institucion": user.institucion.nombre if user.institucion else "Todas las Instituciones",
        "total_estudiantes": estudiantes_count,
        "total_docentes": docentes_count,
        "total_coordinadores": coordinadores_count,
        "total_aulas_creadas": aulas_count,
        "total_grupos_activos": grupos_count,
        "total_actividades_pedagogicas": actividades_count,
        "subastas_activas_en_curso": subastas_activas
    }


TOOL_HANDLERS = {
    "get_my_classrooms_and_groups": execute_get_my_classrooms_and_groups,
    "get_classroom_students": execute_get_classroom_students,
    "get_activities": execute_get_activities,
    "create_activity": execute_create_activity,
    "get_submissions_to_grade": execute_get_submissions_to_grade,
    "grade_submission": execute_grade_submission,
    "get_auctions": execute_get_auctions,
    "create_auction": execute_create_auction,
    "award_educoins": execute_award_educoins,
    "get_institution_summary": execute_get_institution_summary,
}


def dispatch_tool(tool_name: str, arguments: dict, user) -> dict:
    """Ejecuta con seguridad la función solicitada por la IA."""
    handler = TOOL_HANDLERS.get(tool_name)
    if not handler:
        return {"error": f"Herramienta desconocida '{tool_name}'"}
    try:
        return handler(user, arguments)
    except Exception as e:
        logger.error("Error al ejecutar herramienta %s: %s", tool_name, str(e), exc_info=True)
        return {"error": f"Fallo al ejecutar {tool_name}: {str(e)}"}
