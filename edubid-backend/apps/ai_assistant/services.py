import json
import logging
import requests
from django.conf import settings

from .tools import AI_TOOLS_DEFINITIONS, dispatch_tool

logger = logging.getLogger(__name__)

GOOGLE_GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"


def build_system_prompt(user, context=None) -> str:
    """
    Construye el System Prompt para EDUBID IA como Copiloto Pedagógico,
    con acceso exclusivo de consulta, apoyo evaluativo y motivación escolar,
    restringiendo terminantemente la creación y eliminación de entidades.
    """
    role = getattr(user, 'role', 'docente')
    nombre = f"{user.first_name} {user.last_name}".strip() if user else "Docente"
    if not nombre and user:
        nombre = user.username or user.email
    
    institucion_nombre = "Institución Educativa"
    if user and getattr(user, 'institucion', None):
        institucion_nombre = user.institucion.nombre

    role_titles = {
        'docente': 'Docente',
        'coordinador': 'Coordinador(a) Académico(a)',
        'rector': 'Rector(a)',
        'admin': 'Administrador(a) del Sistema',
    }
    role_title = role_titles.get(role, 'Educador(a)')

    prompt = f"""Eres **EDUBID IA**, el copiloto pedagógico inteligente integrado en la plataforma educativa **EduBid**.
Estás interactuando con:
- **Usuario:** {nombre}
- **Rol:** {role_title}
- **Institución:** {institucion_nombre}

### POLÍTICA ESTRICTA DE PERMISOS Y SEGURIDAD:
1. **PROHIBIDO CREAR Y ELIMINAR ELEMENTOS:**
   - Como asistente de IA, **NO tienes permisos ni herramientas para CREAR ni ELIMINAR** clases, asignaturas, grupos escolares, actividades académicas ni subastas.
   - Si el usuario te solicita crear o eliminar una clase, grupo, tarea o subasta (por ejemplo: *"crea una tarea en el grupo TIC"*, *"crea la clase de Matemáticas"*, *"elimina el grupo A1"*):
     - **NO intentes crear ni eliminar nada.**
     - Explica con amabilidad y claridad que por políticas de seguridad e integridad institucional, no tienes permisos para crear ni eliminar elementos en la base de datos de EduBid.
     - Orienta al docente indicándole la sección de la plataforma donde puede realizarlo él mismo (ejemplo: *"Para crear una tarea, ingresa al módulo de Actividades y haz clic en 'Nueva Actividad'"*).
   - Si el docente te pide **ideas, enunciados, objetivos o rúbricas de evaluación** para una actividad pedagógica, SÍ puedes redactar y estructurar el contenido en el chat para que el docente lo copie y use en la plataforma, pero aclárale que no la has guardado en el sistema.

2. **VERIFICACIÓN OBLIGATORIA DE EXISTENCIA (CERO ALUCINACIONES):**
   - Cuando el usuario mencione una asignatura o grupo específico (por ejemplo: *"el grupo TIC"*, *"el grupo B2"*, *"la clase de Robótica"*):
     - **DEBES ejecutar primero la herramienta `get_my_classrooms_and_groups`** para verificar si realmente existe en sus registros.
     - Si la asignatura o el grupo **NO existe**:
       - Infórmaselo de inmediato con total claridad y precisión: *"Actualmente no encuentro ningún grupo o asignatura llamado '[nombre]' registrado en tus clases."*
       - Menciona brevemente los grupos o asignaturas reales que sí tiene registrados.
       - **JAMÁS inventes, asumas, ni intentes registrar grupos o clases que no existen.**

3. **HERRAMIENTAS DISPONIBLES (CONSULTA Y APOYO PEDAGÓGICO):**
   - `get_my_classrooms_and_groups`: Consulta las asignaturas y grupos que el docente tiene a cargo para verificar datos y existencia.
   - `get_classroom_students`: Consulta los estudiantes inscritos en un grupo, correos y saldos de EduCoins.
   - `get_activities`: Consulta las actividades pedagógicas creadas y estado de entregas.
   - `get_submissions_to_grade`: Consulta entregas de estudiantes pendientes de calificación o ya revisadas.
   - `grade_submission`: Califica una entrega (escala 0.0 a 5.0) y brinda retroalimentación pedagógica formativa, abonando EduCoins si aprueba.
   - `get_auctions`: Consulta subastas pedagógicas activas o cerradas.
   - `award_educoins`: Otorga EduCoins directamente a un estudiante por mérito, participación o puntualidad.
   - `get_institution_summary`: Si el usuario es Rector o Coordinador, consulta el reporte métrico consolidado de la institución.

### REGLAS FUNDAMENTALES DE COMUNICACIÓN Y FORMATO:
- **PROHIBIDO MOSTRAR IDs TÉCNICOS AL USUARIO:** NUNCA incluyas identificadores numéricos de base de datos en tus respuestas (por ejemplo: JAMÁS escribas "ID: 4", "ID: 5", "ID: 2", etc.). El usuario no conoce de IDs ni tiene necesidad de verlos; menciona siempre los **nombres naturales** de las asignaturas, clases o grupos (ej: "Desarrollo Móvil", "Grupo A1"). Los IDs son exclusivamente para tu uso interno al invocar herramientas.
- **Respuestas Claras, Precisas y Directas:** Sé conciso, elegante y pedagógico. Responde exactamente lo que el usuario preguntó sin desglosar datos innecesarios ni abrumarlo con información sobrante.
- **Tono:** Profesional, pedagógico, empático, colaborativo y contextualizado a la educación colombiana.
"""

    if context:
        prompt += f"\n### CONTEXTO DE LA PANTALLA ACTUAL:\n{context}\n"

    return prompt.strip()


def send_chat_completion(messages: list, user, context: str = None) -> dict:
    """
    Envía la conversación al proveedor configurado (Google Gemini AI Studio con
    OpenRouter como respaldo) con soporte completo para Tool Calling iterativo
    (Agente Autónomo).
    """
    system_prompt = build_system_prompt(user, context)
    
    formatted_messages = [{"role": "system", "content": system_prompt}]
    
    # Mantener historial reciente (últimos 10 mensajes)
    for msg in messages[-10:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ["user", "assistant"] and content:
            formatted_messages.append({"role": role, "content": content})

    provider = getattr(settings, 'AI_PROVIDER', 'google').lower()
    gemini_key = getattr(settings, 'GEMINI_API_KEY', '') or ''
    openrouter_key = getattr(settings, 'OPENROUTER_API_KEY', '') or ''
    max_tokens = getattr(settings, 'AI_MAX_TOKENS', 1500)

    # Definir la lista de proveedores a intentar en orden de prioridad
    attempts = []

    if provider == 'google' and gemini_key:
        primary_model = getattr(settings, 'GEMINI_MODEL', 'gemini-3.6-flash')
        fallback_model = getattr(settings, 'GEMINI_FALLBACK_MODEL', 'gemini-3.8-flash')
        attempts.append({
            "name": "Google AI Studio",
            "endpoint": GOOGLE_GEMINI_ENDPOINT,
            "headers": {
                "Authorization": f"Bearer {gemini_key}",
                "Content-Type": "application/json"
            },
            "models": [primary_model] if primary_model == fallback_model else [primary_model, fallback_model]
        })
        if openrouter_key:
            attempts.append({
                "name": "OpenRouter (Respaldo)",
                "endpoint": OPENROUTER_ENDPOINT,
                "headers": {
                    "Authorization": f"Bearer {openrouter_key}",
                    "HTTP-Referer": "https://edubid.up.railway.app",
                    "X-Title": "EduBid IA",
                    "Content-Type": "application/json"
                },
                "models": [getattr(settings, 'OPENROUTER_MODEL', 'openai/gpt-4o')]
            })
    else:
        # Fallback a OpenRouter como principal si provider no es google
        if openrouter_key:
            attempts.append({
                "name": "OpenRouter",
                "endpoint": OPENROUTER_ENDPOINT,
                "headers": {
                    "Authorization": f"Bearer {openrouter_key}",
                    "HTTP-Referer": "https://edubid.up.railway.app",
                    "X-Title": "EduBid IA",
                    "Content-Type": "application/json"
                },
                "models": [
                    getattr(settings, 'OPENROUTER_MODEL', 'openai/gpt-4o'),
                    getattr(settings, 'OPENROUTER_FALLBACK_MODEL', 'openai/gpt-4o-mini')
                ]
            })
        if gemini_key:
            attempts.append({
                "name": "Google AI Studio",
                "endpoint": GOOGLE_GEMINI_ENDPOINT,
                "headers": {
                    "Authorization": f"Bearer {gemini_key}",
                    "Content-Type": "application/json"
                },
                "models": [getattr(settings, 'GEMINI_MODEL', 'gemini-3.6-flash')]
            })

    if not attempts:
        raise ValueError("No se encontraron claves de API configuradas para EDUBID IA (ni GEMINI_API_KEY ni OPENROUTER_API_KEY).")

    last_error = None

    for attempt in attempts:
        endpoint = attempt["endpoint"]
        headers = attempt["headers"]
        provider_name = attempt["name"]

        for model in attempt["models"]:
            try:
                # Bucle iterativo del Agente (hasta 3 rondas de llamadas a herramientas)
                current_messages = list(formatted_messages)
                executed_tools = []

                for iteration in range(3):
                    payload = {
                        "model": model,
                        "messages": current_messages,
                        "max_tokens": max_tokens,
                        "temperature": 0.5,
                        "tools": AI_TOOLS_DEFINITIONS,
                        "tool_choice": "auto"
                    }

                    logger.info("Iteración %d del Agente con %s (modelo %s)", iteration + 1, provider_name, model)
                    response = requests.post(endpoint, headers=headers, json=payload, timeout=35)

                    if response.status_code != 200:
                        error_data = {}
                        try:
                            error_data = response.json().get("error", {})
                        except Exception:
                            pass
                        error_msg = error_data.get("message", response.text)
                        logger.warning("Error %s en modelo %s (HTTP %s): %s", provider_name, model, response.status_code, error_msg)
                        raise RuntimeError(f"{provider_name} (HTTP {response.status_code}): {error_msg}")

                    data = response.json()
                    choice = data.get("choices", [{}])[0]
                    message = choice.get("message", {})
                    tool_calls = message.get("tool_calls")

                    # Si el modelo decide ejecutar una o varias herramientas
                    if tool_calls:
                        current_messages.append(message)

                        for tc in tool_calls:
                            fn_name = tc.get("function", {}).get("name", "")
                            fn_args_str = tc.get("function", {}).get("arguments", "{}")
                            call_id = tc.get("id", "")

                            try:
                                fn_args = json.loads(fn_args_str) if fn_args_str else {}
                            except Exception:
                                fn_args = {}

                            logger.info("Agente ejecutando herramienta: %s con argumentos: %s", fn_name, fn_args)
                            executed_tools.append(fn_name)
                            tool_result = dispatch_tool(fn_name, fn_args, user)

                            current_messages.append({
                                "role": "tool",
                                "tool_call_id": call_id,
                                "name": fn_name,
                                "content": json.dumps(tool_result, ensure_ascii=False)
                            })

                        # Siguiente iteración para que el modelo procese los resultados del tool
                        continue
                    else:
                        # Respuesta final del modelo generada con éxito
                        final_content = message.get("content", "")
                        return {
                            "content": final_content,
                            "model": model,
                            "provider": provider_name,
                            "usage": data.get("usage", {}),
                            "executed_tools": executed_tools
                        }

            except Exception as e:
                logger.error("Fallo con %s (modelo %s): %s", provider_name, model, str(e))
                last_error = str(e)
                # Intenta el siguiente modelo o proveedor

    raise RuntimeError(last_error or "No se pudo obtener respuesta del agente EDUBID IA.")
