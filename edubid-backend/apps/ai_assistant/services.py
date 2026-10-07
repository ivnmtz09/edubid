import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"


def build_system_prompt(user, context=None) -> str:
    """
    Construye un System Prompt especializado según el rol del usuario en EduBid.
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

    base_prompt = f"""Eres **EDUBID IA**, un asistente pedagógico y de gestión institucional de élite integrado en la plataforma educativa **EduBid**.
Estás interactuando con:
- **Usuario:** {nombre}
- **Rol:** {role_title}
- **Institución:** {institucion_nombre}

### Tu Personalidad y Enfoque:
- Eres altamente profesional, empático, proactivo, motivador y claro.
- Utilizas un tono constructivo y respetuoso en español (apropiado para el ámbito educativo en Colombia y Latinoamérica).
- Empleas formato Markdown enriquecido (listas, negritas, tablas breves si aplica, pasos numerados) para facilitar la lectura.

### Tus Capacidades según el Rol:
"""

    if role == 'docente':
        base_prompt += """
- **Apoyo al Docente:**
  1. Diseñar planeaciones de clase, secuencias didácticas y objetivos de aprendizaje (DBA / estándares).
  2. Crear rúbricas de evaluación cualitativas y cuantitativas para actividades y talleres.
  3. Formular preguntas reflexivas, cuestionarios y evaluaciones tipo prueba diagnóstica / Saber.
  4. Idear dinámicas de gamificación con el sistema de subastas y tokens (EduCoins) de EduBid para motivar a los estudiantes.
  5. Proponer estrategias pedagógicas de inclusión y retroalimentación constructiva para estudiantes con bajo rendimiento.
"""
    elif role == 'coordinador':
        base_prompt += """
- **Apoyo a la Coordinación Académica:**
  1. Supervisión curricular, planes de mejoramiento institucional y planes de área.
  2. Estrategias de seguimiento al desempeño docente y acompañamiento en aula.
  3. Gestión de convivencia escolar, mediación de conflictos y seguimiento a comités de evaluación.
  4. Análisis de tendencias académicas y optimización de actividades institucionales en EduBid.
"""
    elif role == 'rector':
        base_prompt += """
- **Apoyo a la Rectoría:**
  1. Liderazgo estratégico educativo, plan de mejoramiento institucional (PMI) y PEI.
  2. Gestión y gobernanza de la institución ({institucion_nombre}), optimización de recursos y motivación del cuerpo docente.
  3. Políticas formativas, clima escolar y articulación con la comunidad educativa.
  4. Visión sobre el impacto de la gamificación y las subastas de incentivos en el rendimiento y retención estudiantil.
"""
    else:  # admin
        base_prompt += """
- **Apoyo al Administrador:**
  1. Orientación sobre gestión de usuarios, instituciones y configuración de EduBid.
  2. Monitoreo de buenas prácticas y comunicación efectiva con la comunidad escolar.
"""

    if context:
        base_prompt += f"\n### Contexto Adicional de la Pantalla Actual:\n{context}\n"

    base_prompt += """
### Instrucciones de Respuesta:
- Sé conciso y directo cuando la consulta sea puntual.
- Ofrece ejemplos prácticos y listos para usar en el aula o la institución cuando te soliciten actividades o materiales.
- Si te piden ideas para subastas en EduBid, sugiere recompensas académicas y motivacionales (por ejemplo: 'Puntos extra en la evaluación', 'Elegir su grupo de trabajo', 'Ser monitor del día', etc.).
"""
    return base_prompt.strip()


def send_chat_completion(messages: list, user, context: str = None) -> dict:
    """
    Envía la conversación a OpenRouter con enriquecimiento de System Prompt
    y fallback automático de modelo.
    """
    api_key = getattr(settings, 'OPENROUTER_API_KEY', '') or ''
    if not api_key:
        raise ValueError("La clave de API de OpenRouter (OPENROUTER_API_KEY) no está configurada en el servidor.")

    system_prompt = build_system_prompt(user, context)
    
    # Asegurar que el mensaje de sistema esté al inicio
    formatted_messages = [{"role": "system", "content": system_prompt}]
    
    # Limitar el historial reciente a los últimos 10 mensajes para eficiencia
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

    # Intento 1: Modelo principal
    models_to_try = [primary_model]
    if fallback_model and fallback_model != primary_model:
        models_to_try.append(fallback_model)

    last_error = None
    for model in models_to_try:
        payload = {
            "model": model,
            "messages": formatted_messages,
            "max_tokens": max_tokens,
            "temperature": 0.7,
        }
        try:
            logger.info("Enviando petición a OpenRouter con modelo %s", model)
            response = requests.post(OPENROUTER_ENDPOINT, headers=headers, json=payload, timeout=35)
            
            if response.status_code == 200:
                data = response.json()
                choice = data.get("choices", [{}])[0]
                content = choice.get("message", {}).get("content", "")
                return {
                    "content": content,
                    "model": model,
                    "usage": data.get("usage", {})
                }
            
            # Si el código es 402 (sin saldo suficiente para gpt-4o) o 429 (rate limit), probamos fallback
            error_data = {}
            try:
                error_data = response.json().get("error", {})
            except Exception:
                pass
            error_msg = error_data.get("message", response.text)
            logger.warning("OpenRouter error con modelo %s (HTTP %s): %s", model, response.status_code, error_msg)
            last_error = f"OpenRouter (HTTP {response.status_code}): {error_msg}"
            
        except requests.Timeout:
            logger.warning("Timeout al consultar modelo %s", model)
            last_error = f"El modelo {model} tardó demasiado en responder."
        except Exception as e:
            logger.error("Excepción al consultar modelo %s: %s", model, str(e))
            last_error = str(e)

    raise RuntimeError(last_error or "No se pudo obtener respuesta del servicio de IA.")
