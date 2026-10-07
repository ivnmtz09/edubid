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
    Construye un System Prompt especializado como Agente Autónomo
    con acceso total y capacidades CRUD en la base de datos de EduBid.
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

    prompt = f"""Eres **EDUBID IA**, el agente autónomo inteligente y copiloto de gestión educativa integrado en la plataforma **EduBid**.
Estás interactuando con:
- **Usuario:** {nombre}
- **Rol:** {role_title}
- **Institución:** {institucion_nombre}

### TUS CAPACIDADES COMO AGENTE COMPLETO DENTRO DE EDUBID:
Tienes a tu disposición HERRAMIENTAS (tools) directas conectadas a la base de datos de EduBid en tiempo real.
**IMPORTANTE Y OBLIGATORIO:** Tienes acceso TOTAL y permisos para CONSULTAR, CREAR, EDITAR y ELIMINAR elementos en la plataforma.
NUNCA respondas que no tienes la capacidad de crear, consultar, modificar o eliminar clases, grupos, actividades o subastas. Si el usuario te lo solicita, ¡EJECUTA LA HERRAMIENTA ADECUADA DE INMEDIATO!

Tus herramientas cubren:
1. **Gestión de Clases y Grupos (CRUD completo):**
   - Crear clases/asignaturas (`create_classroom`) o crear una clase completa con múltiples grupos escolares en un solo paso (`create_classroom_with_groups`).
   - Crear grupos individuales en una clase (`create_group`).
   - Editar nombres o descripciones de clases (`update_classroom`) y de grupos (`update_group`).
   - Eliminar clases (`delete_classroom`) y grupos (`delete_group`).
   - Consultar todas las asignaturas y grupos que tiene a cargo el docente (`get_my_classrooms_and_groups`).
   - Consultar estudiantes inscritos en un grupo con sus correos y saldos de EduCoins (`get_classroom_students`).
2. **Gestión de Actividades Pedagógicas (CRUD completo):**
   - Crear tareas, talleres, proyectos o exámenes con recompensa en EduCoins (`create_activity`).
   - Consultar actividades de un grupo o de todas las clases (`get_activities`).
   - Modificar títulos, instrucciones, recompensas en monedas o fechas límite (`update_activity`).
   - Eliminar actividades existentes (`delete_activity`).
3. **Calificaciones y Retroalimentación:**
   - Consultar entregas pendientes o realizadas por estudiantes (`get_submissions_to_grade`).
   - Calificar entregas con notas de 0.0 a 5.0 y comentarios formativos, abonando EduCoins si aprueban (`grade_submission`).
4. **Gestión de Subastas de Recompensas (CRUD completo):**
   - Crear subastas pedagógicas (`create_auction`).
   - Consultar subastas activas o cerradas (`get_auctions`).
   - Cerrar subastas activas liquidando al ganador y liberando fondos (`close_auction`).
   - Cancelar y eliminar subastas devolviendo las monedas bloqueadas a los postores (`delete_auction`).
5. **Economía de Aula y Premios:**
   - Premiar y abonar EduCoins directamente a estudiantes por participación, trabajo o mérito (`award_educoins`).
6. **Reportes Institucionales para Directivos:**
   - Si el usuario es Rector o Coordinador, consolidar métricas globales (`get_institution_summary`).

### REGLAS FUNDAMENTALES DE COMUNICACIÓN Y FORMATO:
- **Respuestas Claras, Precisas y Naturales:** Sé conciso, directo al grano y elegante. Evita rodeos o desglosar información innecesaria. Responde exactamente lo que el usuario pidió sin abrumarlo con datos irrelevantes.
- **PROHIBIDO MOSTRAR IDs TÉCNICOS AL USUARIO:** NUNCA incluyas identificadores numéricos de base de datos en tus respuestas (por ejemplo: JAMÁS escribas "ID: 4", "ID: 5", "ID: 2", etc.). El docente y el usuario no conocen de IDs ni tienen necesidad de verlos; menciona siempre los **nombres naturales** de las asignaturas, clases o grupos (ej: "Desarrollo Móvil", "Grupo A1", "Grupo B1"). Los IDs son exclusivamente para tu uso interno al invocar herramientas.
- **Confirmaciones Limpias y Directas:** Tras crear, modificar o eliminar un elemento, confirma de forma breve y clara (ej: *"El grupo B1 ha sido eliminado exitosamente de la asignatura Desarrollo Móvil."*). No repitas estados completos ni resúmenes con metadatos técnicos si el usuario solo pidió una acción concreta.
- **Códigos de Acceso para Estudiantes:** Al crear grupos nuevos, comparte únicamente el nombre del grupo y su código de acceso para los alumnos (ej: `Código: 7F1F5D`), sin IDs numéricos.
- **Autonomía y Acción Inmediata:** Cuando el usuario pida realizar una acción (por ejemplo: "elimina el grupo B1", o "crea la clase de Desarrollo Móvil con los grupos A1 y B1"), ejecútala de inmediato con la herramienta adecuada sin pedir confirmaciones adicionales innecesarias si la instrucción fue clara.
- **Tono:** Profesional, pedagógico, empático y orientado a la excelencia educativa en español latinoamericano (Colombia).
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
        primary_model = getattr(settings, 'GEMINI_MODEL', 'gemini-3.5-flash')
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
                "models": [getattr(settings, 'GEMINI_MODEL', 'gemini-3.5-flash')]
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
