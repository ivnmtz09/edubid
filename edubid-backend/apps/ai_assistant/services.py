import json
import logging
import requests
from django.conf import settings

from .tools import AI_TOOLS_DEFINITIONS, dispatch_tool

logger = logging.getLogger(__name__)

OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"


def build_system_prompt(user, context=None) -> str:
    """
    Construye un System Prompt especializado como Agente Autónomo
    con acceso total a herramientas de EduBid.
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
Tienes a tu disposición HERRAMIENTAS (tools) directas conectadas a la base de datos de EduBid.
**IMPORTANTE:** Tienes acceso TOTAL y en tiempo real a los datos de este usuario y su institución. NUNCA respondas que no tienes acceso a la plataforma o a su información académica. Si te preguntan por asignaturas, grupos, estudiantes, actividades, entregas, subastas o notas, ¡UTILIZA TUS HERRAMIENTAS INMEDIATAMENTE!

Puedes realizar de forma autónoma:
1. **Consultar asignaturas y grupos:** Conocer qué aulas, grupos y códigos tiene el usuario (`get_my_classrooms_and_groups`).
2. **Consultar estudiantes:** Ver listados de alumnos de un grupo, sus correos y su saldo actual de EduCoins (`get_classroom_students`).
3. **Crear y consultar actividades:** Diseñar y publicar tareas, proyectos o evaluaciones con recompensas en EduCoins y fechas de entrega (`create_activity`, `get_activities`).
4. **Revisar y calificar entregas:** Ver las entregas de los estudiantes y calificarlas con nota y retroalimentación (`get_submissions_to_grade`, `grade_submission`).
5. **Crear y gestionar subastas:** Crear subastas de incentivos pedagógicos en el aula (`create_auction`, `get_auctions`).
6. **Asignar EduCoins:** Premiar a estudiantes con monedas por mérito, puntualidad o participación (`award_educoins`).
7. **Reportes directivos:** Si el usuario es Rector o Coordinador, generar consolidados institucionales (`get_institution_summary`).

### REGLAS DE COMPORTAMIENTO:
- **Proactividad:** Cuando el usuario te pida realizar una acción (por ejemplo: "Crea una tarea sobre la Célula para el grupo 10-A con 100 EduCoins"), ejecútala con la herramienta correspondiente y confirma detalladamente el resultado.
- **Formato:** Presenta los datos de forma ordenada con viñetas, tablas breves o pasos numerados usando Markdown limpio.
- **Tono:** Profesional, cercano, empático y constructivo en español para el ámbito educativo en Colombia y Latinoamérica.
"""

    if context:
        prompt += f"\n### CONTEXTO DE LA PANTALLA ACTUAL:\n{context}\n"

    return prompt.strip()


def send_chat_completion(messages: list, user, context: str = None) -> dict:
    """
    Envía la conversación a OpenRouter con soporte para Tool Calling iterativo
    (Agente Autónomo completo) y fallback de modelo.
    """
    api_key = getattr(settings, 'OPENROUTER_API_KEY', '') or ''
    if not api_key:
        raise ValueError("La clave de API de OpenRouter (OPENROUTER_API_KEY) no está configurada en el servidor.")

    system_prompt = build_system_prompt(user, context)
    
    formatted_messages = [{"role": "system", "content": system_prompt}]
    
    # Mantener historial reciente (últimos 10 mensajes)
    for msg in messages[-10:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ["user", "assistant"] and content:
            formatted_messages.append({"role": role, "content": content})

    primary_model = getattr(settings, 'OPENROUTER_MODEL', 'openai/gpt-4o')
    fallback_model = getattr(settings, 'OPENROUTER_FALLBACK_MODEL', 'openai/gpt-4o-mini')
    max_tokens = getattr(settings, 'OPENROUTER_MAX_TOKENS', 1500)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://edubid.up.railway.app",
        "X-Title": "EduBid IA",
        "Content-Type": "application/json"
    }

    models_to_try = [primary_model]
    if fallback_model and fallback_model != primary_model:
        models_to_try.append(fallback_model)

    last_error = None
    for model in models_to_try:
        try:
            # Bucle del Agente (hasta 3 rondas de herramientas por consulta)
            current_messages = list(formatted_messages)
            
            for iteration in range(3):
                payload = {
                    "model": model,
                    "messages": current_messages,
                    "max_tokens": max_tokens,
                    "temperature": 0.5,
                    "tools": AI_TOOLS_DEFINITIONS,
                    "tool_choice": "auto"
                }

                logger.info("Iteración %d del Agente con modelo %s", iteration + 1, model)
                response = requests.post(OPENROUTER_ENDPOINT, headers=headers, json=payload, timeout=35)
                
                if response.status_code != 200:
                    error_data = {}
                    try:
                        error_data = response.json().get("error", {})
                    except Exception:
                        pass
                    error_msg = error_data.get("message", response.text)
                    logger.warning("Error OpenRouter en modelo %s (HTTP %s): %s", model, response.status_code, error_msg)
                    raise RuntimeError(f"OpenRouter (HTTP {response.status_code}): {error_msg}")

                data = response.json()
                choice = data.get("choices", [{}])[0]
                message = choice.get("message", {})
                tool_calls = message.get("tool_calls")

                # Si el modelo decidió llamar a una o más herramientas
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
                        tool_result = dispatch_tool(fn_name, fn_args, user)

                        current_messages.append({
                            "role": "tool",
                            "tool_call_id": call_id,
                            "name": fn_name,
                            "content": json.dumps(tool_result, ensure_ascii=False)
                        })

                    # Continuar el bucle para que el modelo interprete el resultado del tool
                    continue
                else:
                    # El modelo dio una respuesta final
                    final_content = message.get("content", "")
                    return {
                        "content": final_content,
                        "model": model,
                        "usage": data.get("usage", {})
                    }

        except Exception as e:
            logger.error("Fallo con modelo %s: %s", model, str(e))
            last_error = str(e)
            # Continúa con el siguiente modelo de fallback

    raise RuntimeError(last_error or "No se pudo obtener respuesta del agente EDUBID IA.")
