import logging
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db.models import Count, Q

from apps.classrooms.models import Classroom
from apps.groups.models import Group
from apps.activities.models import Activity, Submission
from apps.auctions.models import Auction, Bid
from apps.auctions.services import cerrar_subasta
from apps.tokens.models import Period, Wallet, CoinTransaction
from apps.users.models import User

logger = logging.getLogger(__name__)

# Definiciones de herramientas para OpenAI / OpenRouter Tool Calling
AI_TOOLS_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_my_classrooms_and_groups",
            "description": "Consulta las asignaturas (aulas/classrooms/clases) y grupos que tiene a cargo el docente o la institución. Muestra nombres, códigos de acceso y cantidad de estudiantes.",
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
            "name": "create_classroom",
            "description": "Crea una nueva clase o asignatura (Classroom/Aula) para el docente en la plataforma.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nombre": {
                        "type": "string",
                        "description": "Nombre de la clase o asignatura (ej: 'Desarrollo Móvil', 'Física 11°')."
                    },
                    "descripcion": {
                        "type": "string",
                        "description": "Descripción opcional de la clase o asignatura."
                    }
                },
                "required": ["nombre"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_group",
            "description": "Crea un nuevo grupo escolar dentro de una clase o asignatura existente. El sistema le generará automáticamente un código de unión único y sus 3 períodos de cortes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "classroom_id": {
                        "type": "integer",
                        "description": "ID numérico de la clase o asignatura donde se creará el grupo."
                    },
                    "nombre": {
                        "type": "string",
                        "description": "Nombre del grupo (ej: 'A1', 'B1', 'Grupo 10-A')."
                    },
                    "descripcion": {
                        "type": "string",
                        "description": "Descripción opcional del grupo."
                    }
                },
                "required": ["classroom_id", "nombre"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_classroom_with_groups",
            "description": "Crea una clase o asignatura y uno o varios grupos escolares asociados en una sola operación (ej: clase 'Desarrollo Móvil' con grupos ['A1', 'B1']).",
            "parameters": {
                "type": "object",
                "properties": {
                    "nombre_asignatura": {
                        "type": "string",
                        "description": "Nombre de la asignatura o clase (ej: 'Desarrollo Móvil')."
                    },
                    "descripcion_asignatura": {
                        "type": "string",
                        "description": "Descripción opcional de la clase."
                    },
                    "nombres_grupos": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Lista con los nombres de los grupos a crear (ej: ['A1', 'B1'])."
                    }
                },
                "required": ["nombre_asignatura", "nombres_grupos"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_classroom",
            "description": "Elimina una asignatura o clase creada por el docente.",
            "parameters": {
                "type": "object",
                "properties": {
                    "classroom_id": {
                        "type": "integer",
                        "description": "ID de la clase a eliminar."
                    }
                },
                "required": ["classroom_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_group",
            "description": "Elimina un grupo escolar de una clase o asignatura.",
            "parameters": {
                "type": "object",
                "properties": {
                    "grupo_id": {
                        "type": "integer",
                        "description": "ID del grupo a eliminar."
                    }
                },
                "required": ["grupo_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_classroom",
            "description": "Edita o actualiza el nombre o la descripción de una clase o asignatura existente.",
            "parameters": {
                "type": "object",
                "properties": {
                    "classroom_id": {
                        "type": "integer",
                        "description": "ID de la clase a editar."
                    },
                    "nombre": {
                        "type": "string",
                        "description": "Nuevo nombre para la clase (opcional)."
                    },
                    "descripcion": {
                        "type": "string",
                        "description": "Nueva descripción para la clase (opcional)."
                    }
                },
                "required": ["classroom_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_group",
            "description": "Edita o actualiza el nombre o la descripción de un grupo escolar existente.",
            "parameters": {
                "type": "object",
                "properties": {
                    "grupo_id": {
                        "type": "integer",
                        "description": "ID del grupo a editar."
                    },
                    "nombre": {
                        "type": "string",
                        "description": "Nuevo nombre para el grupo (opcional)."
                    },
                    "descripcion": {
                        "type": "string",
                        "description": "Nueva descripción para el grupo (opcional)."
                    }
                },
                "required": ["grupo_id"]
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
            "name": "update_activity",
            "description": "Edita una actividad pedagógica existente (cambiar título, descripción, recompensa en EduCoins o ampliar días de entrega).",
            "parameters": {
                "type": "object",
                "properties": {
                    "activity_id": {
                        "type": "integer",
                        "description": "ID de la actividad a modificar."
                    },
                    "nombre": {
                        "type": "string",
                        "description": "Nuevo título de la actividad."
                    },
                    "descripcion": {
                        "type": "string",
                        "description": "Nuevas instrucciones o rúbrica."
                    },
                    "valor_educoins": {
                        "type": "integer",
                        "description": "Nuevo valor de recompensa en EduCoins."
                    },
                    "dias_para_entrega": {
                        "type": "integer",
                        "description": "Nuevos días límite a partir de hoy."
                    }
                },
                "required": ["activity_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_activity",
            "description": "Elimina permanentemente una actividad pedagógica creada por el docente.",
            "parameters": {
                "type": "object",
                "properties": {
                    "activity_id": {
                        "type": "integer",
                        "description": "ID de la actividad a eliminar."
                    }
                },
                "required": ["activity_id"]
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
            "name": "close_auction",
            "description": "Cierra una subasta activa de inmediato, liquida y cobra los EduCoins al postor ganador y devuelve las monedas a los demás participantes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "auction_id": {
                        "type": "integer",
                        "description": "ID de la subasta a cerrar."
                    }
                },
                "required": ["auction_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_auction",
            "description": "Elimina una subasta activa devolviendo todas las monedas bloqueadas a los postores.",
            "parameters": {
                "type": "object",
                "properties": {
                    "auction_id": {
                        "type": "integer",
                        "description": "ID de la subasta a cancelar y eliminar."
                    }
                },
                "required": ["auction_id"]
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


def execute_create_classroom(user, args):
    """Crea una nueva clase o asignatura para el docente."""
    if user.role not in ['docente', 'admin', 'rector', 'coordinador']:
        return {"error": "Solo docentes o directivos tienen permisos para crear clases."}

    nombre = args.get('nombre', '').strip()
    if not nombre:
        return {"error": "El nombre de la clase es obligatorio."}

    descripcion = args.get('descripcion', '').strip()

    docente = user
    docente_id = args.get('docente_id')
    if docente_id and user.role in ['admin', 'rector', 'coordinador']:
        try:
            docente = User.objects.get(id=docente_id, role='docente')
        except User.DoesNotExist:
            return {"error": f"No se encontró un docente con ID {docente_id}."}

    classroom = Classroom.objects.create(
        nombre=nombre,
        descripcion=descripcion or None,
        docente=docente
    )

    return {
        "status": "success",
        "classroom_id": classroom.id,
        "nombre": classroom.nombre,
        "descripcion": classroom.descripcion or "",
        "docente": f"{docente.first_name} {docente.last_name}".strip() or docente.email,
        "mensaje": f"Clase '{classroom.nombre}' creada exitosamente."
    }


def execute_create_group(user, args):
    """Crea un grupo dentro de una clase existente."""
    if user.role not in ['docente', 'admin', 'rector', 'coordinador']:
        return {"error": "Solo docentes o directivos pueden crear grupos."}

    classroom_id = args.get('classroom_id')
    nombre = args.get('nombre', '').strip()
    descripcion = args.get('descripcion', '').strip()

    if not classroom_id:
        return {"error": "Debes especificar el ID de la clase (classroom_id)."}
    if not nombre:
        return {"error": "El nombre del grupo es obligatorio."}

    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        return {"error": f"No existe la clase con ID {classroom_id}."}

    if user.role == 'docente' and classroom.docente_id != user.id:
        return {"error": "No tienes permiso para agregar grupos a una clase que no te pertenece."}

    if Group.objects.filter(classroom=classroom, nombre__iexact=nombre, activo=True).exists():
        return {"error": f"Ya existe un grupo activo con el nombre '{nombre}' en la clase '{classroom.nombre}'."}

    grupo = Group.objects.create(
        classroom=classroom,
        nombre=nombre,
        descripcion=descripcion or None,
        activo=True
    )

    return {
        "status": "success",
        "grupo_id": grupo.id,
        "grupo_nombre": grupo.nombre,
        "classroom_id": classroom.id,
        "classroom_nombre": classroom.nombre,
        "codigo_acceso": grupo.codigo,
        "mensaje": f"Grupo '{grupo.nombre}' creado exitosamente en '{classroom.nombre}' con código de acceso {grupo.codigo}."
    }


def execute_create_classroom_with_groups(user, args):
    """Crea una clase y sus grupos en una sola transacción atómica."""
    if user.role not in ['docente', 'admin', 'rector', 'coordinador']:
        return {"error": "Solo docentes o directivos tienen permisos para crear clases y grupos."}

    nombre_asignatura = args.get('nombre_asignatura', '').strip()
    descripcion_asignatura = args.get('descripcion_asignatura', '').strip()
    nombres_grupos = args.get('nombres_grupos', [])

    if not nombre_asignatura:
        return {"error": "El nombre de la asignatura/clase es obligatorio."}

    if not nombres_grupos or not isinstance(nombres_grupos, list):
        return {"error": "Debes proporcionar una lista con al menos un nombre de grupo en 'nombres_grupos'."}

    docente = user
    docente_id = args.get('docente_id')
    if docente_id and user.role in ['admin', 'rector', 'coordinador']:
        try:
            docente = User.objects.get(id=docente_id, role='docente')
        except User.DoesNotExist:
            return {"error": f"No se encontró un docente con ID {docente_id}."}

    with transaction.atomic():
        classroom = Classroom.objects.create(
            nombre=nombre_asignatura,
            descripcion=descripcion_asignatura or None,
            docente=docente
        )

        grupos_creados = []
        for g_nombre in nombres_grupos:
            g_nombre_clean = str(g_nombre).strip()
            if not g_nombre_clean:
                continue
            grupo = Group.objects.create(
                classroom=classroom,
                nombre=g_nombre_clean,
                activo=True
            )
            grupos_creados.append({
                "id": grupo.id,
                "nombre": grupo.nombre,
                "codigo_acceso": grupo.codigo
            })

    detalles_grupos = ", ".join([f"{g['nombre']} (Código: {g['codigo_acceso']})" for g in grupos_creados])
    return {
        "status": "success",
        "classroom_id": classroom.id,
        "classroom_nombre": classroom.nombre,
        "docente": f"{docente.first_name} {docente.last_name}".strip() or docente.email,
        "total_grupos_creados": len(grupos_creados),
        "grupos": grupos_creados,
        "mensaje": f"Se ha creado exitosamente la clase '{classroom.nombre}' con {len(grupos_creados)} grupos: {detalles_grupos}."
    }


def execute_delete_classroom(user, args):
    """Elimina una clase del docente."""
    classroom_id = args.get('classroom_id')
    if not classroom_id:
        return {"error": "Debes especificar el classroom_id a eliminar."}

    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        return {"error": f"No existe la clase con ID {classroom_id}."}

    if user.role == 'docente' and classroom.docente_id != user.id:
        return {"error": "No tienes permiso para eliminar esta clase porque no eres su docente titular."}
    elif user.role not in ['docente', 'admin', 'rector']:
        return {"error": "No tienes permisos para eliminar clases."}

    nombre = classroom.nombre
    classroom.delete()
    return {
        "status": "success",
        "mensaje": f"La clase '{nombre}' y todos sus grupos asociados han sido eliminados correctamente."
    }


def execute_delete_group(user, args):
    """Elimina un grupo de una clase."""
    grupo_id = args.get('grupo_id')
    if not grupo_id:
        return {"error": "Debes especificar el grupo_id a eliminar."}

    try:
        grupo = Group.objects.get(id=grupo_id)
    except Group.DoesNotExist:
        return {"error": f"No existe el grupo con ID {grupo_id}."}

    if user.role == 'docente' and grupo.classroom.docente_id != user.id:
        return {"error": "No tienes permiso para eliminar este grupo."}
    elif user.role not in ['docente', 'admin', 'rector']:
        return {"error": "No tienes permisos para eliminar grupos."}

    nombre = grupo.nombre
    classroom_nombre = grupo.classroom.nombre
    grupo.delete()
    return {
        "status": "success",
        "mensaje": f"El grupo '{nombre}' de la clase '{classroom_nombre}' ha sido eliminado correctamente."
    }


def execute_update_classroom(user, args):
    """Edita el nombre o descripción de una clase/aula existente."""
    classroom_id = args.get('classroom_id')
    if not classroom_id:
        return {"error": "Debes especificar el classroom_id a editar."}

    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        return {"error": f"No existe la clase con ID {classroom_id}."}

    if user.role == 'docente' and classroom.docente_id != user.id:
        return {"error": "No tienes permiso para editar esta clase porque no eres su docente titular."}
    elif user.role not in ['docente', 'admin', 'rector']:
        return {"error": "No tienes permisos para editar clases."}

    nombre = args.get('nombre')
    descripcion = args.get('descripcion')

    if nombre:
        classroom.nombre = str(nombre).strip()
    if descripcion is not None:
        classroom.descripcion = str(descripcion).strip()

    classroom.save()

    return {
        "status": "success",
        "mensaje": f"Clase '{classroom.nombre}' actualizada exitosamente.",
        "classroom": {
            "id": classroom.id,
            "nombre": classroom.nombre,
            "descripcion": classroom.descripcion
        }
    }


def execute_update_group(user, args):
    """Edita el nombre o descripción de un grupo escolar."""
    grupo_id = args.get('grupo_id')
    if not grupo_id:
        return {"error": "Debes especificar el grupo_id a editar."}

    try:
        grupo = Group.objects.select_related('classroom').get(id=grupo_id)
    except Group.DoesNotExist:
        return {"error": f"No existe el grupo con ID {grupo_id}."}

    if user.role == 'docente' and grupo.classroom.docente_id != user.id:
        return {"error": "No tienes permiso para editar este grupo."}
    elif user.role not in ['docente', 'admin', 'rector']:
        return {"error": "No tienes permisos para editar grupos."}

    nombre = args.get('nombre')
    descripcion = args.get('descripcion')

    if nombre:
        grupo.nombre = str(nombre).strip()
    if descripcion is not None:
        grupo.descripcion = str(descripcion).strip()

    grupo.save()

    return {
        "status": "success",
        "mensaje": f"Grupo '{grupo.nombre}' de la clase '{grupo.classroom.nombre}' actualizado exitosamente.",
        "grupo": {
            "id": grupo.id,
            "nombre": grupo.nombre,
            "descripcion": grupo.descripcion,
            "codigo_acceso": grupo.codigo_acceso
        }
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


def execute_update_activity(user, args):
    """Edita una actividad pedagógica existente."""
    activity_id = args.get('activity_id')
    if not activity_id:
        return {"error": "Debes especificar el activity_id a modificar."}

    try:
        act = Activity.objects.select_related('group', 'group__classroom').get(id=activity_id)
    except Activity.DoesNotExist:
        return {"error": f"No se encontró la actividad con ID {activity_id}."}

    if user.role == 'docente' and act.group.classroom.docente_id != user.id:
        return {"error": "No tienes permiso para modificar esta actividad."}
    elif user.role not in ['docente', 'admin', 'rector']:
        return {"error": "No tienes permisos para modificar actividades."}

    nombre = args.get('nombre')
    descripcion = args.get('descripcion')
    valor_educoins = args.get('valor_educoins')
    dias = args.get('dias_para_entrega')

    if nombre:
        act.nombre = str(nombre).strip()
    if descripcion is not None:
        act.descripcion = str(descripcion).strip()
    if valor_educoins is not None:
        act.valor_educoins = max(0, int(valor_educoins))
    if dias is not None:
        act.fecha_entrega = timezone.now() + timedelta(days=int(dias))

    act.save()

    return {
        "status": "success",
        "mensaje": f"Actividad '{act.nombre}' modificada exitosamente.",
        "actividad": {
            "id": act.id,
            "nombre": act.nombre,
            "tipo": act.tipo,
            "grupo": act.group.nombre,
            "valor_educoins": act.valor_educoins,
            "fecha_entrega": act.fecha_entrega.strftime('%Y-%m-%d %H:%M') if act.fecha_entrega else ""
        }
    }


def execute_delete_activity(user, args):
    """Elimina permanentemente una actividad pedagógica."""
    activity_id = args.get('activity_id')
    if not activity_id:
        return {"error": "Debes especificar el activity_id a eliminar."}

    try:
        act = Activity.objects.select_related('group', 'group__classroom').get(id=activity_id)
    except Activity.DoesNotExist:
        return {"error": f"No se encontró la actividad con ID {activity_id}."}

    if user.role == 'docente' and act.group.classroom.docente_id != user.id:
        return {"error": "No tienes permiso para eliminar esta actividad."}
    elif user.role not in ['docente', 'admin', 'rector']:
        return {"error": "No tienes permisos para eliminar actividades."}

    nombre = act.nombre
    grupo_nombre = act.group.nombre
    act.delete()

    return {
        "status": "success",
        "mensaje": f"Actividad '{nombre}' del grupo '{grupo_nombre}' eliminada permanentemente."
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


def execute_close_auction(user, args):
    """Cierra una subasta activa y liquida al postor ganador."""
    auction_id = args.get('auction_id')
    if not auction_id:
        return {"error": "Debes especificar el auction_id a cerrar."}

    try:
        auction = Auction.objects.select_related('grupo', 'grupo__classroom').get(id=auction_id)
    except Auction.DoesNotExist:
        return {"error": f"No se encontró la subasta con ID {auction_id}."}

    if user.role == 'docente' and auction.creador_id != user.id and auction.grupo.classroom.docente_id != user.id:
        return {"error": "Solo el creador o docente titular puede cerrar esta subasta."}
    elif user.role not in ['docente', 'admin', 'rector']:
        return {"error": "No tienes permisos para cerrar subastas."}

    if auction.estado != 'active':
        return {"error": f"La subasta '{auction.titulo}' ya se encuentra {auction.estado}."}

    res = cerrar_subasta(auction)
    if not res.get("success"):
        return {"error": res.get("message", "Error al procesar el cierre de la subasta.")}

    if not res.get("ganador"):
        return {
            "status": "success",
            "mensaje": f"Subasta '{auction.titulo}' cerrada exitosamente sin ofertas/pujas registradas."
        }

    return {
        "status": "success",
        "mensaje": f"Subasta '{auction.titulo}' cerrada exitosamente. Ganador: {res.get('ganador', {}).get('nombre', 'Estudiante')} con puja de {res.get('ganador', {}).get('puja', 0)} EduCoins.",
        "ganador": res.get("ganador"),
        "total_participantes": res.get("total_participantes", 0)
    }


def execute_delete_auction(user, args):
    """Elimina una subasta activa devolviendo los EduCoins bloqueados."""
    auction_id = args.get('auction_id')
    if not auction_id:
        return {"error": "Debes especificar el auction_id a eliminar."}

    try:
        auction = Auction.objects.select_related('grupo', 'grupo__classroom').get(id=auction_id)
    except Auction.DoesNotExist:
        return {"error": f"No se encontró la subasta con ID {auction_id}."}

    if user.role == 'docente' and auction.creador_id != user.id and auction.grupo.classroom.docente_id != user.id:
        return {"error": "No tienes permiso para eliminar esta subasta."}
    elif user.role not in ['docente', 'admin', 'rector']:
        return {"error": "No tienes permisos para eliminar subastas."}

    if auction.estado == 'closed':
        return {"error": "No se puede eliminar una subasta que ya está cerrada."}

    with transaction.atomic():
        periodo_activo = Period.objects.filter(grupo=auction.grupo, activo=True).first()
        if not periodo_activo:
            periodo_activo = Period.objects.filter(grupo=auction.grupo).order_by('-fecha_fin').first()

        for bid in auction.bids.all():
            try:
                if periodo_activo:
                    wallet = Wallet.objects.select_for_update().get(
                        usuario=bid.estudiante,
                        grupo=auction.grupo,
                        periodo=periodo_activo
                    )
                    wallet.bloqueado_educoins = max(0, wallet.bloqueado_educoins - bid.cantidad_educoins)
                    wallet.save()
            except Wallet.DoesNotExist:
                pass

        titulo = auction.titulo
        auction.delete()

    return {
        "status": "success",
        "mensaje": f"La subasta '{titulo}' ha sido cancelada y eliminada con éxito. Las monedas de los participantes han sido liberadas."
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
    "create_classroom": execute_create_classroom,
    "create_group": execute_create_group,
    "create_classroom_with_groups": execute_create_classroom_with_groups,
    "update_classroom": execute_update_classroom,
    "delete_classroom": execute_delete_classroom,
    "update_group": execute_update_group,
    "delete_group": execute_delete_group,
    "get_classroom_students": execute_get_classroom_students,
    "get_activities": execute_get_activities,
    "create_activity": execute_create_activity,
    "update_activity": execute_update_activity,
    "delete_activity": execute_delete_activity,
    "get_submissions_to_grade": execute_get_submissions_to_grade,
    "grade_submission": execute_grade_submission,
    "get_auctions": execute_get_auctions,
    "create_auction": execute_create_auction,
    "close_auction": execute_close_auction,
    "delete_auction": execute_delete_auction,
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
