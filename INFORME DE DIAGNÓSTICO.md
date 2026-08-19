# Nota previa importante

El archivo `PROPUESTA DE INVESTIGACIÓN educoin.docx` que está en la raíz **NO** es una plantilla vacía: es un borrador de propuesta ya diligenciado, y tiene un defecto grave que detallo en la sección 21: a partir de la sección "Identificación de las variables", el contenido pertenece a otro proyecto completamente distinto (un sistema web para la "Fundación Servicio en Acción"). Esto es crítico de cara a tu evaluación.

---

## 1. Resumen del proyecto

**EduBid** (renombrado desde "EduCoin" según el historial git) es una plataforma web SaaS de gamificación educativa con una economía interna basada en monedas digitales (EduCoins) canjeables mediante subastas.

Los docentes premian comportamientos académicos positivos (participación, puntualidad, entrega de tareas, rendimiento) asignando monedas; los estudiantes las acumulan en billeteras virtuales y las usan para pujar por premios definidos por el docente en un módulo de subastas estratégicas.

Es una aplicación web full-stack:
- **Backend:** API REST (Django + DRF + MySQL)
- **Frontend:** SPA (React + Vite + Tailwind)

Pensada para despliegue en Railway/Netlify, con autenticación JWT + Google OAuth, roles institucionales (admin, rector, coordinador, docente, estudiante) y personalización "white-label" por institución.

---

## 2. Arquitectura identificada


- **Patrón:** monorepo con dos carpetas (`edubid-backend/`, `edubid-frontend/`), SPA + API REST (estilo "separación total", sin server-side rendering; el `app/page.tsx` y la dependencia `next` son residuos muertos de un setup anterior de Next.js).
- **Backend modular:** 11 apps Django (`users`, `institutions`, `classrooms`, `groups`, `activities`, `grades`, `tokens`, `auctions`, `notifications`, `common`, `reports`).
- **Modelo de datos:** usuarios con roles e institución; clase → grupo (con código de acceso) → actividades; periodos ("Cortes 1-3", 3 por grupo, creados automáticamente); billetera por estudiante/grupo/periodo; transacciones; subastas y pujas; calificaciones; notificaciones.
- **Lógica de negocio sensible:** implementada con transacciones atómicas (`transaction.atomic` en subastas y pujas).
- **Capa de permisos:** clases DRF por rol (`IsAdmin`, `IsDocente`, `AdminOrDocente`, `IsRector`, `IsCoordinador`, `IsInstitutionStaff`) + filtrado de querysets por rol en cada vista.

---

## 3. Tecnologías utilizadas

| Capa | Tecnología | Evidencia |
|------|------------|-----------|
| Backend | Django 5.2.6, Django REST Framework 3.16.1, SimpleJWT 5.5.1 | `requirements.txt` |
| BD | MySQL 8.0 (pymysql), docker-compose para dev | `docker-compose.yml`, `settings.py:147-159` |
| Auth | JWT (access 1h / refresh 1d con rotación y blacklist), django-allauth + Google OAuth, verificación de email | `settings.py:210-233`, `users/views.py` |
| Emails | SendGrid API (verificación, bienvenida, reset, eliminación) | `users/email_utils.py` |
| Frontend | React 19, Vite 7, Tailwind CSS 4, TanStack Query 5, React Router 7, Axios, Headless UI, Framer Motion | `package.json` |
| Despliegue | Railway (backend, config rota) + Netlify (frontend) | `Procfile`, `railway.toml`, `netlify.toml` |
| Extras | WhiteNoise (estáticos), throttling (30 req/min/usuario), docker-compose MySQL | `settings.py` |

> **Dato a corregir en la propuesta:** el borrador `.docx` dice "Django, Angular y MySQL" en su metodología — Angular **no se usa**; el frontend es **React**.

---

## 4. Usuarios y roles

| Rol | Qué puede hacer (verificado en código) |
|-----|----------------------------------------|
| **estudiante** | Unirse a grupos con código, ver actividades, entregar (texto/archivo), ver notas, acumular EduCoins, pujar en subastas, ver billetera e historial, notificaciones |
| **docente** | CRUD de clases, grupos (código de acceso), actividades, calificaciones (individual/masiva), periodos, subastas (crear/cerrar/eliminar, pujar en nombre de estudiantes), asignar monedas manualmente, enviar anuncios |
| **rector** | Configurar white-label de su institución (logo, colores) — sin métricas aún |
| **coordinador** | Mismo dashboard que admin (lista de usuarios) |
| **admin** | Instituciones, usuarios, todo (usa Django Admin para gestión completa) |

> `RectorDashboard.jsx` y el onboarding multitenant existen, pero el aislamiento institucional completo **no** está implementado en todos los módulos (el filtro por institución solo aparece en notificaciones e instituciones).

---

## 5. Funcionalidades existentes

Verificadas en código (backend + frontend):

- Registro con email + verificación (token) y reenvío; login con tracking de fallos y sugerencia de reset; Google OAuth; cambio/recuperación de contraseña; eliminación de cuenta; perfil.
- CRUD de clases, grupos (código de acceso único de 6 caracteres, expira en 30 días), unión por código o por ID (crea la billetera automáticamente).
- Actividades (tipos: reto, misión, proyecto, evaluación) con valor en EduCoins, archivo adjunto, fecha de entrega, habilitación; entregas de estudiantes con cancelación antes de vencimiento/calificación.
- Calificaciones: individual, masiva, cálculo proporcional de EduCoins por nota (porcentaje × valor de la actividad + bonus 10% si nota ≥ 90%), señal automática que deposita en la billetera, reporte por grupo (API), promedio del estudiante.
- Economía: periodos "Corte 1-3" automáticos al crear grupo, activación/desactivación, billeteras por estudiante/grupo/periodo, depósitos manuales del docente, gastos, reinicios de periodo, historial de transacciones (earn/spend/reset).
- Subastas: valor mínimo, incremento mínimo configurable, pujas con bloqueo de saldo, aumento de puja propia, puja del docente a nombre de estudiante, cierre con pago del ganador y reembolso a los demás participantes, eliminación con devolución, stats.
- Notificaciones: motor con 16 tipos (actividad, calificación, monedas, subasta, seguridad, anuncio, etc.), marcar leídas, borrar, estadísticas, envío docente→estudiantes, dropdown en el header con polling de 15 s.
- SaaS: instituciones con código DANE, colores y logo (white-label), onboarding "completar perfil" con selección de institución, inyección de colores de marca, restricción "un rector por institución".
- UI: dark mode persistente, dashboards por rol, sidebar por rol, wallet visual, landing animada.

---

## 6. Sistema de gamificación

**Lo que existe realmente:**
- Economía de tokens (EduCoins) como elemento central: se ganan por desempeño calificado, se gastan en subastas.
- Subastas estratégicas (mecánica diferenciadora real): decisión de cuánto y cuándo pujar, saldo limitado, bloqueo/reembolso — esto es lo más novedoso del sistema.
- Tipología lúdica de actividades (reto/misión/proyecto/evaluación).
- Periodos/cortes con reinicio de economía ("temporadas").
- Retroalimentación inmediata: notificaciones de eventos (monedas ganadas, subasta ganada, etc.).

**Lo que NO existe** (aunque el README y el landing lo prometen):
- Ranking/tabla de posiciones (0 resultados de `ranking|leaderboard` en todo el código). El README lo lista para estudiantes; el landing dice "desafía a otros, sube de nivel" — es marketing sin implementación.
- Insignias/logros (0 resultados de `badge|insignia|achievement`).
- Niveles/XP de jugador: el campo `puntos_experiencia` existe pero se usa como denominador de la nota máxima (`Grade.calcular_coins_ganados`), no como experiencia acumulable.
- Rachas, retos entre estudiantes, misiones encadenadas.

---

## 7. Sistema de recompensas

**Implementado y robusto:**
- Asignación automática de EduCoins al calificar (proporcional a la nota, con bonus por excelencia) — `grades/models.py:33-85`.
- Depósito manual del docente por comportamientos (puntualidad, participación, etc.) — `tokens/views.py:160-175`.
- Billeteras con saldo disponible y saldo bloqueado durante pujas (economía real, sin fraude de saldo) — `tokens/models.py:54-85`.
- Transacciones auditables (earn/spend/reset) — historial visible en `WalletPage`.
- Canje de monedas por premios vía subasta, con pago al ganador y reembolso a perdedores — `auctions/views.py:119-209`.
- Reinicio de economía por periodo ("Corte") con transacción de tipo `reset`.

> No existe: catálogo de premios persistente, canje directo (sin subasta), recompensas programadas, etc. (no hace falta para el alcance académico).

---

## 8. Sistema de aprendizaje

- **Gestión de contenidos/actividades:** el docente publica actividades (con descripción, adjunto, fecha límite, valor en EduCoins); el estudiante las entrega (texto o archivo).
- **Evaluación:** calificación con retroalimentación; promedio general del estudiante; reporte por grupo con notas y EduCoins por actividad (`grades/views.py:70-138`).
- **Seguimiento:** el estudiante ve su progreso por actividad (porcentaje), su promedio y su saldo; el docente ve estados de entregas.
- **No es un LMS completo:** no hay módulos de contenido teórico (lecciones), cuestionarios/preguntas-respuesta automáticos, ni rúbricas. La "evaluación" es calificación manual del docente sobre entregas.

---

## 9. Flujo general del sistema

---

## 10. Estado actual del desarrollo

Verificaciones ejecutadas durante la auditoría:
- `python manage.py check` → sin errores.
- `npm run build` → build de producción exitoso (1158 módulos; advertencia de chunk > 500 kB, no bloqueante).
- `git log` → proyecto activo, última actividad julio 2026 (fix de credenciales en docker-compose).
- **Tests automatizados:** 0 (los 11 `tests.py` son el stub vacío de Django, 63 caracteres).

Tu estimación del **75%** es coherente con la evidencia: el núcleo funcional está completo y compila, pero faltan pruebas, validación académica, documentación, correcciones de calidad y partes prometidas (reportes, ranking, analítica).

---

## 11. Funcionalidades terminadas

1. Autenticación completa (registro+verificación, login con seguridad, Google OAuth, reset/change password, eliminación de cuenta).
2. Perfil e instituciones (onboarding multitenant, white-label).
3. CRUD de clases y grupos con códigos de acceso y creación automática de periodos.
4. Actividades + entregas (con archivos) + cancelación controlada.
5. Calificaciones (individual, masiva, reporte de grupo, promedio) + depósito automático de EduCoins.
6. Economía de tokens (billeteras, depósitos manuales, transacciones, reinicio de periodo).
7. Módulo de subastas completo (pujas, bloqueo de saldo, aumentos, cierre, reembolsos, puja por docente).
8. Motor de notificaciones + UI (dropdown, leer, eliminar, enviar a estudiantes).
9. Dashboards por rol (estudiante/docente/admin/rector).
10. Dark mode, diseño responsive, landing.
11. Migraciones aplicables en los 11 módulos.

---

## 12. Funcionalidades parciales

1. Dashboard de rector: solo white-label; sin métricas de su institución.
2. Panel de coordinador: reutiliza el dashboard de admin; sin gestión propia.
3. Reportes/analítica: backend tiene endpoints útiles (reporte de grupo, promedio, stats de subastas) pero no hay vista de reportes en el frontend y la app `reports` es un stub vacío (`reports/views.py` es el archivo de Django por defecto). El README promete "Analítica Avanzada".
4. Wallet del docente: página informativa con tarjetas "Depositar/Reiniciar/Gestionar" sin botones funcionales.
5. SaaS multi-tenant: onboarding completo, pero el aislamiento por institución no se aplica en todos los módulos (`classrooms/groups/activities/auctions` se filtran por docente, no por institución).
6. Notificaciones en tiempo real: por polling (15 s), no websockets — suficiente para el alcance, pero no es "tiempo real" estricto.

---

## 13. Funcionalidades pendientes

1. Tests automatizados (0 en todo el proyecto) — **crítico**.
2. Ranking/tabla de posiciones (prometido en README y landing; el README lo lista como feature de estudiante).
3. Vista de reportes/analítica para docente (reporte de grupo ya existe en API).
4. Arreglar configuración de despliegue: `Procfile` y `railway.toml` referencian `Educoin.wsgi` que no existe (el módulo real es `edubid_core.wsgi`); `railway_setup.sh` referencia `create_superuser.py` inexistente. El deploy está roto.
5. Validación académica con usuarios reales (prueba piloto con docentes/estudiantes + instrumentos de medición) — el corazón de la parte académica de tu propuesta.
6. Documentación: manual técnico, manual de usuario, docs de API (Swagger), evidencias, video demo.
7. Datos semilla/demo para demostraciones (no hay seeders ni management commands).
8. Limpieza de código muerto y bugs (detallado en §28).

---

## 14. Problema que realmente aborda

Basado en lo que el sistema hace, no en el marketing:

Los sistemas educativos tradicionales (incluido el contexto local colombiano) evalúan casi exclusivamente con calificaciones numéricas, ignorando dimensiones del comportamiento académico como constancia, participación, puntualidad y esfuerzo sostenido. Esto reduce la motivación a lo instrumental y no ofrece a los docentes herramientas accesibles para reconocer y recompensar el esfuerzo más allá de la nota.

Existen plataformas gamificadas globales (puntos/insignias), pero en el contexto local falta una herramienta web accesible, adaptable al docente y con mecánicas de recompensa canjeables que den valor real al esfuerzo.

**Lo que el proyecto aporta de concreto:** una mecánica de subastas de premios como forma de canje del esfuerzo — es el elemento diferenciador frente a plataformas de "puntos + insignias" y está completamente implementada (algo que la literatura, p. ej. Prieto Andreu 2020 citado en tu propio borrador, señala como el diseño con mayor impacto: "recompensas canjeables generan mayor impacto que insignias no redimibles").

El borrador `.docx` ya formula bien el problema (secciones de planteamiento/formulación); solo hay que alinearlo con el estado real del software y eliminar la contaminación del otro proyecto.

---

## 15. Propuesta de valor

- **Para el docente:** herramienta sencilla para premiar conductas (puntualidad, participación, esfuerzo) con monedas, administrar premios vía subastas y ver el progreso del grupo sin hojas de cálculo.
- **Para el estudiante:** visibilidad transparente de su esfuerzo (saldo, historial, promedio), decisión estratégica (en qué subasta gastar sus monedas) y reconocimiento tangible más allá de la nota.
- **Diferencial técnico:** economía de tokens con bloqueo de saldo y reembolsos (integridad anti-fraude), arquitectura modular extensible, autenticación segura, multitenant incipiente.
- **Diferencial pedagógico:** el sistema complementa la evaluación tradicional (no la reemplaza): la nota sigue existiendo; las monedas reconocen lo que la nota no captura.
- **Apalancamiento teórico directo:** TAD de Deci y Ryan (recompensa simbólica como puente hacia motivación autónoma), condicionamiento operante de Skinner (refuerzo positivo inmediato), gamificación (Deterding; Hamari) — todos ya citados correctamente en el marco teórico del borrador.

---

## 16. Posible aporte académico

1. Caso de estudio contextualizado de gamificación con recompensas canjeables en educación superior colombiana (La Guajira) — hay poca evidencia local.
2. Evidencia empírica (a generar en la prueba piloto) sobre percepción de motivación y usabilidad con un instrumento adaptado (p. ej., escalas basadas en TAM de Davis — ya citado — y/o MSLQ/IMI), con indicadores medibles desde la propia plataforma (actividades entregadas, participación en subastas, saldos, tasas de entrega).
3. Artefacto de software reutilizable (licencia MIT) como referente de arquitectura Django+React para gamificación educativa.
4. Aporte metodológico: validación de una mecánica de subastas como elemento de recompensa, un diseño poco estudiado en la literatura hispanohablante.

---

## 17. Fortalezas del proyecto

1. Núcleo funcional completo y compilable (`check` Django OK, build React OK).
2. Lógica de economía bien resuelta: bloqueo de saldo en pujas, reembolsos, transacciones atómicas — complejidad real bien implementada (`auctions/views.py:253-381`).
3. Seguridad por encima de la media para un proyecto de grado: JWT con rotación+blacklist, verificación de email obligatoria, tracking de intentos de login fallidos, rate limiting, emails vía SendGrid, permisos por rol en cada queryset.
4. Arquitectura modular y limpia (11 apps con responsabilidades claras, serializers separados, señales para lógica transversal).
5. Automatización de procesos educativos: periodos auto-generados, wallets auto-creadas, señales de recompensa — el "motor" funciona solo.
6. UI/UX cuidada: dark mode, dashboards por rol, landing animada, componentes consistentes.
7. Documentación técnica inicial (README completo con endpoints e instalación) e historial git organizado por features.
8. Marco teórico del borrador ya está bien redactado (TAD, Skinner, Deterding, Hamari, Kapp, TAM) — solo hay que integrarlo con el resto.

---

## 18. Debilidades detectadas

1. **CERO tests automatizados** — el punto más débil técnicamente. Un jurado técnico lo notará.
2. Deploy roto (`Procfile`/`railway.toml` → `Educoin.wsgi` inexistente; el `MEJORA_Y_MADUREZ.md` lo confirma).
3. Promesas no implementadas (ranking, analítica, "sube de nivel") en README y landing — si el jurado pide demostrarlas, contradicción.
4. Código muerto y residuos: dependencia `next` (~7.7 MB), `app/page.tsx`, hooks/componentes huérfanos, servicios sin usar, imports rotos en componentes huérfanos.
5. URLs hardcodeadas a `localhost:8000` en 4 archivos del frontend (`LoginForm`, `AdminDashboard`, `Header`, `Sidebar`) — rompe cualquier despliegue real.
6. Ruta de redirección rota tras login (`AuthContext` navega a `/dashboard/teacher` que no existe; el catch-all la redirige).
7. Aislamiento multitenant incompleto (filtro por docente, no por institución).
8. Sin datos demo/seeders — difícil de evaluar sin poblar la BD.
9. Sin instrumentos de medición académica (encuestas/escalas) ni evidencia de prueba piloto.
10. Backend usa `print()` para logging (en vez de logging estructurado) en módulos críticos.

---

## 19. Riesgos de cara a la evaluación universitaria

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Presentar el `.docx` tal cual (mezclado con otro proyecto) → rechazo inmediato | Alta | Crítico | Reescribir variables/operacionalización/metodología/impacto/productos/presupuesto/bibliografía (sección 21) |
| Jurado detecte que "el 75% ya está hecho" pero la propuesta plantee 18 meses desde cero | Alta | Alto | Cronograma realista: fases cumplidas + fase de validación |
| Cero tests + código muerto visibles en demo | Media | Medio | Fase de saneamiento y tests antes de entrega |
| Nombre inconsistente (EduCoin en propuesta/emails, EduBid en código/README) | Alta | Medio | Unificar nombre oficial |
| Objetivo "Validar mediante pruebas piloto" sin evidencias ni instrumentos | Alta | Alto | Diseñar instrumento y ejecutar piloto real en la Universidad |
| Presupuesto de $300.000 sin justificación | Media | Bajo-Medio | Justificar o ajustar (10h/sem × 18 meses × 2 personas es el recurso real) |
| Antecedentes/bibliografía de la propuesta sin referencias de gamificación en la lista final | Alta | Medio | Completar referentes (ya citados inline en marco teórico) |

---

## 20. Información que falta

**DATOS POR CONFIRMAR:**

- ¿Se aplicaron ya encuestas/entrevistas de diagnóstico a docentes/estudiantes? ¿Hay resultados?
- ¿Se ejecutó alguna prueba piloto con usuarios reales? ¿Con quién y cuándo?
- ¿El sistema está desplegado en algún entorno accesible (Railway/Netlify/otro)? (La config está rota.)
- ¿Cuántos usuarios/registros reales hay en la BD de desarrollo? (No hay datos en el repo.)
- ¿La Universidad exige un instrumento específico (formato oficial) además de este `.docx`? ¿El "Acuerdo 006 de 2025" tiene requisitos adicionales?
- ¿Qué metodología se usó de facto durante el desarrollo (evidencia solo del historial git: commits incrementales por feature)? ¿Pueden declararla como iterativa-incremental?
- ¿Cuál es el nombre oficial del producto: **EduCoin** o **EduBid**?
- ¿Se dictaron/desarrollaron las actividades con valores reales (cuántas clases, grupos, actividades de prueba)?
- Fechas reales: ¿cuándo inicia el semestre académico, cuándo deben entregar la propuesta y el trabajo final?

---

## 21. Análisis de la plantilla universitaria (.docx)

### 21.1 Estructura que exige la plantilla (según el documento)

| Bloque | Contenido actual en el `.docx` | Estado |
|--------|--------------------------------|--------|
| Portada | Facultad, programa, título, línea de investigación (Acuerdo 006/2025), temática, grupo, duración (18 meses), tipo (Aplicada), modalidad (con participación externa), lugar (Riohacha), responsables (Ivan J. Martínez Molina — IP; Juan C. Añez Ahumada — Co-I), datos personales, horas (10 semanales c/u) | ✅ Correcto |
| Resumen + Abstract + palabras clave | EduCoin correcto | ✅ Correcto (mejorar: incluir el módulo de subastas ya existente y ajustar "prototipo" → sistema funcional) |
| Planteamiento y formulación del problema | EduCoin correcto | ✅ Correcto, alineable con el software |
| Objetivos | Correctos conceptualmente | ⚠️ Ajustar a estado real (objetivo 5 = validación pendiente) |
| Justificación y delimitación | Correctas | ⚠️ "PostgreSQL o MySQL" → solo MySQL; "18 meses" → cronograma realista |
| Marco teórico, antecedentes, fundamentación | Muy bueno (TAD, Skinner, Deterding, Hamari, Kapp, TAM) | ✅ Conservar |
| Identificación de variables | ❌ Copiado de OTRO proyecto ("Sistema Web" y "Difusión de Programas Sociales" de la Fundación Servicio en Acción) | 🔴 Rehacer completo |
| Operacionalización de variables | ❌ Ídem, tabla con objetivos y autores del otro proyecto | 🔴 Rehacer completo |
| Metodología | ❌ Habla de la Fundación, menciona Angular, fases de "diagnóstico institucional" | 🔴 Rehacer (mantener enfoque mixto cualitativo-dominante y diseño no experimental, pero para EduBid) |
| Impacto esperado | ❌ Del otro proyecto (transparencia, donantes, fundación) | 🔴 Rehacer |
| Productos/resultados | ❌ "Sistema de visualización de programas sociales" | 🔴 Rehacer |
| Estrategia de comunicación | ❌ Menciona la fundación | 🔴 Rehacer (conservar idea: trabajo de grado + semilleros + video + código abierto) |
| Cronograma | Genérico del otro proyecto (5 fases de 3-4 meses) | ⚠️ Rehacer sobre estado real (desarrollo ya hecho; validación + saneamiento + entrega) |
| Presupuesto | Solo "Reuniones $300.000" | ⚠️ Justificar o ampliar (recursos propios, herramientas libres, 18 meses × 2 estudiantes) |
| Referentes bibliográficos | ❌ Solo referencias de transparencia/ONG; faltan las citadas en el marco teórico (Deci & Ryan, Deterding, Hamari, Kapp, Skinner, Sommerville, Norman, Davis, Prieto Andreu, Ortiz-Colón, Dicheva) | 🔴 Completar |

### 21.2 Relación requisito → disponible → faltante (resumen)

| Requisito de plantilla | Disponible en el proyecto | Faltante |
|------------------------|---------------------------|----------|
| Problema/motivación | Código + marco teórico del borrador | Datos locales (encuestas) para respaldar "ausencia de herramientas locales" |
| Objetivos | Software real | Reformulación al estado 75% |
| Variables | Módulos reales (recompensas, subastas, motivación) | Operacionalización correcta + instrumentos |
| Metodología | Enfoque mixto/no experimental del borrador | Fases adaptadas + metodología de desarrollo (Scrum iterativo) |
| Validación | Endpoints de datos (notas, saldos, subastas) | Piloto real + encuestas + análisis |
| Impacto/productos | Sistema funcional | Redacción correcta + manuales + video + informe |

---

## 22. Mapeo proyecto ↔ propuesta

---

## 23. Posibles títulos

1. "Plataforma web gamificada para el fortalecimiento de la motivación académica mediante un sistema de recompensas digitales canjeables en subastas (EduBid)" — continua la línea del borrador (menos reescritura), agrega el elemento diferenciador real (subastas).

2. "Sistema web de gamificación económica con monedas digitales y subastas educativas para el reconocimiento del esfuerzo académico de estudiantes universitarios"

3. "EduBid: economía de recompensas digitales en el aula — diseño e implementación de una plataforma web para incentivar la participación y constancia académica"

4. "Diseño e implementación de una plataforma web con sistema de recompensas (tokens) y módulo de subastas para complementar la evaluación tradicional en educación superior"

5. "Plataforma web basada en gamificación por recompensas canjeables para el fortalecimiento de la motivación estudiantil: caso Facultad de Ingenierías, Universidad de La Guajira" — si confirman el caso de estudio en su facultad.

6. "Sistema de información web con mecánica de subastas como estrategia de gamificación para el reconocimiento del desempeño académico"

**Recomendación:** la opción 1 (con el nombre oficial que decidan). Razones: es específica (web + motivación + recompensas + subastas), coincide con la línea de investigación declarada (desarrollo de software), es defendible porque cada elemento del título existe en el sistema, y mantiene continuidad con el resumen/objetivos ya aprobados del borrador.

---

## 24. Objetivo general propuesto

Diseñar e implementar una plataforma web gamificada, denominada EduBid (EduCoin), que fortalezca la motivación académica de los estudiantes mediante un sistema de recompensas digitales simbólicas —otorgadas por los docentes y canjeables en un módulo de subastas— como complemento a la evaluación tradicional, y validar su aceptación y efecto percibido en un entorno educativo real de la Universidad de La Guajira.

---

## 25. Objetivos específicos propuestos

1. Diagnosticar las necesidades y expectativas de docentes y estudiantes sobre el reconocimiento del esfuerzo académico y la motivación, mediante instrumentos de recolección de información primaria (encuesta/entrevista). *Pendiente — se ejecutará*

2. Analizar los requerimientos funcionales y no funcionales de la plataforma (autenticación, gestión de aulas/grupos, actividades, calificaciones, economía de EduCoins, subastas, notificaciones, seguridad). *Logrado — evidenciable en código y README*

3. Diseñar la arquitectura del sistema, el modelo de datos y la interfaz de usuario de los módulos funcionales. *Logrado — evidenciable: 11 apps, 22 tablas aprox., UI completa*

4. Desarrollar el prototipo funcional full-stack (React + Django REST + MySQL) garantizando usabilidad, seguridad y escalabilidad. *Logrado ~80% — completar: saneamiento, tests, despliegue*

5. Evaluar el sistema mediante pruebas funcionales y una prueba piloto con docentes y estudiantes, midiendo usabilidad (escala TAM) y percepción de motivación antes/después (escala adaptada). *Pendiente — fase de validación*

6. Documentar el sistema (manual técnico, manual de usuario, manual de despliegue) y sistematizar los resultados de la validación en el informe final. *Pendiente*

> Cada objetivo es verificable: los 2-4 se comprueban con el repositorio y la demo; el 5 con instrumentos y datos; el 6 con entregables físicos.

---

## 26. Metodología recomendada

**Distinción honesta (requerida por la universidad):**

- **Metodología utilizada hasta ahora:** DATO POR CONFIRMAR — no hay evidencia escrita de Scrum/Kanban/XP en el repo. Lo observable es un desarrollo iterativo-incremental (commits por funcionalidad, mejoras progresivas de UI, refactor de nombre EduCoin→EduBid). Puedes declararlo así, es lo que respalda el historial git.

- **Metodología propuesta para la continuación:** Scrum adaptado a equipos de 2 personas (sprints de 2 semanas, backlog priorizado, revisión quincenal con el director de tesis) para las fases restantes (saneamiento → tests → piloto → documentación → entrega). Alternativa viable: Kanban si el director prefiere flujo continuo. El marco académico general (aplicada, no experimental, enfoque mixto con predominio cualitativo) ya está correcto en el borrador y se conserva.

- **Diseño de investigación:** descriptivo-evaluativo con componente tecnológico (Hernández, Fernández y Baptista ya citados): Fase A diagnóstica (encuesta), Fase B de consolidación del artefacto, Fase C de validación (piloto + instrumentos + métricas de la plataforma), Fase D de sistematización.

---

## 27. Alcance propuesto

**INCLUYE:** autenticación segura (JWT + Google + verificación), gestión de instituciones (multitenant/white-label), clases y grupos con códigos de acceso y periodos académicos, actividades con entregas y archivos, calificación con recompensa automática en EduCoins (proporcional + bonus), billeteras por periodo con transacciones auditables, subastas de premios (bloqueo de saldo, reembolsos, cierre), notificaciones, dashboards por rol, dark mode, manuales y validación piloto.

**NO INCLUYE:** pagos reales/monetización, ranking/insignias/niveles (si no se agregan), LMS completo (lecciones, quizzes automáticos), integración con Moodle/Google Classroom, app móvil, tiempo real con websockets, inteligencia artificial, multiidioma, módulo de reportes avanzados con gráficas (salvo lo mínimo que decidan).

**ESTADO ACTUAL:** ~75% (núcleo funcional completo; faltan saneamiento, tests, validación piloto, documentación y pulido). No invento porcentajes por módulo: la evidencia permite afirmar que el flujo completo estudiante↔docente↔subastas funciona de punta a punta.

---

## 28. Actividades necesarias para finalizar el proyecto (priorizadas)

### Fase 0 — Correcciones urgentes (1-2 semanas)

1. Arreglar `Procfile`/`railway.toml` (`Educoin.wsgi` → `edubid_core.wsgi`) y eliminar referencia a `create_superuser.py`.
2. Eliminar dependencia `next` + carpeta `app/` (código muerto).
3. Corregir imports rotos (`hooks useSubmissions`, `AddStudentToGroup`, etc.) o eliminar componentes huérfanos.
4. Corregir redirección post-login (`AuthContext` → rutas `/dashboard/:role` inexistentes).
5. Reemplazar URLs hardcodeadas `localhost:8000` por variables de entorno.

### Fase 1 — Calidad técnica (2-4 semanas)

6. Tests automatizados con `pytest` + `factory-boy`: prioridad auth → wallets/transacciones → subastas (pujar/aumentar/cerrar/reembolsar) → calificaciones/recompensas → permisos por rol. Cobertura mínima razonable (≥70% en los módulos críticos).
7. Limpieza de código muerto (hooks/componentes/servicios huérfanos listados en §12 y §18).
8. Revisión de seguridad: verificar que no queden secretos en git (los `.env` ya no están trackeados ✅), validación de entradas, consistencia de permisos.
9. Seeders/datos demo (script con institución, docente, grupo, estudiantes, actividades, subastas) para demostraciones.

### Fase 2 — Decisiones de alcance (1 semana, con tu director)

10. Decidir: ¿agregar ranking simple (top 10 por grupo, es barato con los datos existentes) o declararlo fuera de alcance y corregir el texto del README/landing? Recomiendo agregar un ranking básico por grupo si el tiempo lo permite: es el único feature prometido que aporta valor de gamificación real y cierra la brecha README↔realidad.
11. Decidir nombre oficial del producto (EduBid vs EduCoin) y unificar en código, emails y documentos.

### Fase 3 — Validación académica (4-8 semanas, paralela)

12. Diseñar instrumentos: encuesta de diagnóstico + escala de usabilidad (TAM) + escala de motivación (IMI o MSLQ adaptada) — aprobar con el director.
13. Ejecutar prueba piloto con 1-2 docentes reales y sus grupos en la Universidad de La Guajira (acuerdo institucional — la modalidad "con participación externa" ya lo contempla).
14. Recolectar métricas de la plataforma (actividades entregadas antes/después, participación en subastas, saldos, retención) y encuestas pre/post.
15. Análisis de resultados (estadística descriptiva + análisis de contenido de comentarios).

### Fase 4 — Documentación y entrega (2-4 semanas)

16. Manual técnico (arquitectura, modelo de datos, despliegue), manual de usuario, README actualizado y honesto.
17. Documentación de API (`drf-spectacular` o Swagger) — opcional pero recomendable.
18. Evidencias: capturas, video demo (3-5 min), guion de demostración para el jurado.
19. Despliegue real (Railway/Netlify u otro) para que el jurado acceda en línea.
20. Informe final + presentación de defensa.

**Total estimado:** 3-4 meses de trabajo efectivo (coherente con 10 h/semanales por estudiante), sin inventar funcionalidades nuevas más allá del ranking opcional.

---

## 29. Recomendaciones para aumentar la probabilidad de aprobación

1. **Nunca presentar el `.docx` actual tal cual** — la mezcla con el proyecto de la Fundación (variables, metodología, impacto, productos, presupuesto, bibliografía) es detectable por cualquier jurado y sería motivo de rechazo o de fuerte cuestionamiento. Es el riesgo #1.

2. **Contar la verdad del estado del proyecto en la propuesta:** decir que el desarrollo del prototipo está avanzado (~75%) y que el aporte académico restante es la validación — esto es una fortaleza (viabilidad alta, riesgo bajo), no una debilidad, si se formula bien ("el proyecto ya cuenta con un prototipo funcional; la presente propuesta formaliza el proceso y centra la fase final en la validación empírica").

3. **Rehacer la operacionalización de variables** con las variables reales. Propuesta:
   - **Variable 1:** Sistema de recompensas gamificado (dimensiones: funcionalidad, usabilidad, seguridad — medibles con pruebas y TAM).
   - **Variable 2:** Motivación académica percibida (dimensiones: motivación intrínseca/extrínseca, participación, constancia — medibles con escala adaptada + métricas de plataforma: entregas, pujas, actividad).

4. **Cronograma honesto de 18 meses:** meses 1-6 (fases ya cumplidas, descritas en retrospectiva), meses 7-15 (saneamiento, tests, piloto, análisis), meses 16-18 (documentación, informe, defensa). Si la universidad exige planificación prospectiva, presenta "plan de trabajo" con fases de cierre y validación como eje.

5. **Agregar el ranking básico** (opcional pero recomendado) para cerrar la brecha entre lo prometido y lo entregado; si no, corregir README/landing para que el alcance declarado coincida con la demo.

6. **Preparar una demo impecable:** datos demo, guion de 10 minutos (registro → clase → grupo → actividad → entrega → calificación → monedas → subasta → cierre → notificaciones).

7. **Completar la bibliografía** con las referencias ya citadas en el marco teórico (Deci & Ryan, 1985; Deterding et al., 2011; Hamari et al., 2014; Kapp, 2012; Skinner, 1938; Sommerville, 2011/2021; Norman, 2013; Davis, 1989; Dicheva et al., 2015; Ortiz-Colón et al., 2018; Prieto Andreu, 2020) y añadir 2-3 antecedentes colombianos de gamificación educativa (búscalos en revistas indexadas; la búsqueda web puede ayudarte).

8. **Presupuesto:** justificar $300.000 (reuniones/logística del piloto) y aclarar que el resto es recursos propios + software libre (Django, React, MySQL, Railway/Netlify free tiers) — la tabla del presupuesto debe reflejar eso.

9. **Gestionar la carta de la institución/participación externa** (docentes participantes del piloto) antes de presentar, para respaldar la modalidad declarada.

10. **Unificar el nombre** (EduCoin vs EduBid) en TODOS los documentos, código y emails antes de la entrega.

---

## Siguientes pasos propuestos

Cuando apruebes este diagnóstico, podemos trabajar en orden:

1. **Reconstrucción de la propuesta** (respetando la estructura de la plantilla): corregir las secciones contaminadas, ajustar objetivos/cronograma/presupuesto al estado real y completar bibliografía.

2. **Definición del instrumento de validación** (encuesta + escala TAM/IMI adaptada) para la prueba piloto.

3. **Soporte en el plan de saneamiento técnico** (Fase 0-1) si lo necesitas.

> Antes de redactar la propuesta final, necesito que confirmes los **DATOS POR CONFIRMAR** de la sección 20, especialmente: nombre oficial del producto, metodología que pueden declarar, si ya hay datos de encuestas/piloto, y si la universidad entregó el formato oficial en Word aparte (o si este `.docx` ES el formato).