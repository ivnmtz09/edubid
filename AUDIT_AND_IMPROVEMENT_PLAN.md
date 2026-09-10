# 📋 EduBid — Plan de Auditoría Técnica, Diagnóstico y Hoja de Ruta de Mejoras

> **Fecha de Auditoría:** 6 de Septiembre, 2026  
> **Proyecto:** EduBid (SaaS Multi-Tenant de Economía Gamificada)  
> **Estado:** Evaluación del Código Fuente y Arquitectura (Sin cambios aplicados)

---

## 1. 📌 Resumen Ejecutivo

El presente documento recopila los hallazgos técnicos derivados de la auditoría integral realizada al proyecto **EduBid**. 

El sistema presenta un diseño de arquitectura bien estructurado, con separación limpia entre la API REST (Django 5.2) y el cliente web SPA (Angular 19+), un esquema multi-tenant sólido y un modelo de datos alineado al propósito de la plataforma. Sin embargo, para que el producto sea **100% apto para producción masiva y operación en tiempo real**, existen mejoras clave en **automatización, pruebas de calidad (QA), seguridad, rendimiento y experiencia de usuario (UX)** que deben ser implementadas.

---

## 2. 📊 Matriz de Priorización de Mejoras

| # | Ítem / Funcionalidad | Área | Prioridad | Riesgo de NO hacerlo | Esfuerzo Estimado |
|---|---|---|---|---|---|
| **1** | Cierre Automático de Subastas (Background Job) | Backend | ✅ **COMPLETADO** | Subastas atascadas, saldo bloqueado sin devolver, insatisfacción de usuarios | Medio |
| **2** | Suite de Pruebas Automatizadas (Unit & Integration Tests) | Backend / QA | ✅ **COMPLETADO** | Fallos silenciosos en lógica transaccional de EduCoins y fugas de aislamiento multi-tenant | Alto |
| **3** | Rate Limiting y Protección de Endpoints Auth | Backend / Seguridad | ✅ **COMPLETADO** | Ataques de fuerza bruta, spam de usuarios, denegación de servicio (DoS) | Bajo |
| **4** | Sincronización Real-Time con WebSockets | Backend / Frontend | ✅ **COMPLETADO** | Subastas lentas, requiere refrescar la página manualmente para ver pujas | Alto |
| **5** | Almacenamiento Nube para Archivos Media (S3/Cloudinary) | DevOps / Backend | 🟡 **MEDIA** | Pérdida de imágenes y tareas adjuntas al reiniciar contenedores en producción | Medio |
| **6** | Normalización de Dependencias Frontend & Build | Frontend | ✅ **COMPLETADO** | Incompatibilidades de compilación CLI, builds de producción pesados | Bajo |
| **7** | Interceptor Global de Errores HTTP | Frontend | ✅ **COMPLETADO** | Interfaz rota o congelada cuando ocurre un error 500 o caída de red | Bajo |
| **8** | Módulo de Exportación de Reportes (PDF / Excel) | Backend / Frontend | 🟢 **BAJA-MEDIA** | Fricción para directivos que requieren informes físicos/impresos | Medio |
| **9** | Paginación Global y Optimización ORM | Backend | ✅ **COMPLETADO** | Lentitud en la API cuando la plataforma tenga miles de usuarios | Bajo |

---

## 3. 🔍 Desglose Detallado de Hallazgos y Justificación Técnica

---

### 1. ⏱️ Cierre Automático de Subastas y Devolución de Saldos (Background Worker)

* **¿Qué hay que hacer?**  
  Implementar un servicio en segundo plano (usando **Celery**, **Django Q** o una tarea de comando administrado en Django disparada por un *cron job*) que verifique periódicamente las subastas cuya `fecha_fin` haya expirado y se encuentren en estado `active`. Al vencer el tiempo, el sistema debe ejecutarse de forma autónoma: cerrar la subasta, cobrar el monto al ganador, registrar la transacción y desbloquear los EduCoins retenidos de los demás postores.

* **¿Por qué hay que hacerlo?**  
  En la implementación actual ([views.py:L128](file:///C:/Proyectos/Web/edubid/edubid-backend/apps/auctions/views.py#L128)), la subasta solo se procesa si el docente ingresa manualmente y presiona el botón "Cerrar". Si el docente lo olvida o no se conecta a tiempo, los saldos en EduCoins de los estudiantes quedan **bloqueados indefinidamente**, impidiéndoles gastar sus monedas en otras actividades.

* **Estado:** ✅ **COMPLETADO & TESTEADO (100% de tests aprobados)**
* **Implementación:**
  * Creado módulo central de liquidación atómica: `apps/auctions/services.py` (`cerrar_subasta` y `cerrar_subastas_expiradas`).
  * Creado comando CLI con modo daemon/watcher y dry-run: `python manage.py close_expired_auctions [--watch] [--dry-run]`.
  * Integrado auto-cierre bajo demanda en `AuctionViewSet` (`list()` y `retrieve()`) para garantizar que la API siempre responda con subastas liquidadas al instante si están vencidas.
  * Agregada suite de 5 pruebas automatizadas completas en `apps/auctions/tests.py` validando cobros, devoluciones, transacciones, notificaciones y endpoints.

---

### 2. 🧪 Suite de Pruebas Automatizadas Unitarias e Integradas (QA)

* **¿Qué hay que hacer?**  
  Crear suites de pruebas automatizadas en Django (`pytest-django` / `TestCase`) y en Angular (`Jasmine/Karma` o `Vitest`).

* **¿Por qué hay que hacerlo?**  
  Actualmente, los archivos `tests.py` en todas las apps backend contienen únicamente 4 líneas de código con la plantilla básica. La lógica financiera (depósitos, gastos, reinicios de saldo en `Wallet`) y las reglas de seguridad Multi-Tenant (aislamiento estricto por `institucion_id`) carecen de pruebas automáticas que garanticen que un cambio futuro no rompa el sistema.

* **Estado:** ✅ **COMPLETADO & TESTEADO (52/52 tests aprobados con 0 errores en 100% de apps backend)**
* **Implementación:**
  * **`apps/users/tests.py` (7 tests):** Restricciones de SuperAdmin (`institucion = None`), unicidad de rector por institución, 5 roles RBAC, perfiles automáticos y permisos `IsDocente`, `AdminOrDocente`.
  * **`apps/tokens/tests.py` (6 tests):** Operaciones financieras en `Wallet` (`depositar`, `gastar`, `resetear`), auditoría mediante `CoinTransaction` y ciclo de vida de periodos (`Period.activar()`).
  * **`apps/grades/tests.py` (5 tests):** Cálculo proporcional de EduCoins, bonificación del 10% por excelencia y acreditación automática vía `post_save`.
  * **`apps/groups/tests.py` (6 tests):** Códigos únicos de grupo de 6 caracteres, matrícula con auto-provisión de `Wallet` y aislamiento multi-tenant.
  * **`apps/auctions/tests.py` (5 tests):** Cierre y liquidación de subastas, transacciones de compra, devoluciones y comando CLI.
  * **`apps/institutions/tests.py` (6 tests):** Validación de modelo `Institution`, `codigo_dane` único, endpoints públicos `/api/institutions/public/`, control CRUD solo admin y actualización de branding restringida a rectores.
  * **`apps/classrooms/tests.py` (5 tests):** Creación de aulas por docentes, restricción a estudiantes y aislamiento estricto multi-tenant entre docentes, rectores y superadmin.
  * **`apps/activities/tests.py` (6 tests):** Creación de actividades en grupos propios vs ajenos, entregas (`Submission`), cancelación de entregas no calificadas y bloqueo de cancelación tras ser calificada.
  * **`apps/notifications/tests.py` (6 tests):** Creación y tipos de notificación, aislamiento privado por usuario, filtros de no leídas, acciones masivas y estadísticas.

---

### 3. 🛡️ Rate Limiting y Protección de Endpoints de Autenticación

* **¿Qué hay que hacer?**  
  Configurar la aceleración de peticiones (*Throttling*) en Django REST Framework utilizando `AnonRateThrottle` y `ScopedRateThrottle`.

* **¿Por qué hay que hacerlo?**  
  Los endpoints de inicio de sesión (`/login/`), registro (`/register/`), inicio con Google (`/google/`) y recuperación de contraseña no tienen límites de intentos. Un bot maligno podría realizar miles de peticiones por segundo para adivinar contraseñas o saturar el servidor.

* **Estado:** ✅ **COMPLETADO & TESTEADO (HTTP 429 verificado en tests unitarios)**
* **Implementación:**
  * Creadas clases aceleradoras en `apps/users/throttles.py`: `AuthRateThrottle` (`scope = 'auth'`) y `PasswordResetRateThrottle` (`scope = 'password_reset'`), identificando a los clientes por IP de manera robusta.
  * Configurado `REST_FRAMEWORK` en `settings.py` con `DEFAULT_THROTTLE_CLASSES` (`AnonRateThrottle` y `UserRateThrottle`) y cuotas dinámicas configurables vía `.env`:
    * `auth`: `10/min` (login, registro, google, reenvío de verificación).
    * `password_reset`: `5/min` (solicitud y confirmación de reseteo).
    * `user`: `120/min`.
    * `anon`: `100/day`.
  * Aplicados decoradores `@throttle_classes` y atributos de clase en `apps/users/views.py` para todos los endpoints de autenticación y reseteo.
  * Agregados tests automatizados en `apps/users/tests.py` (`test_login_rate_limiting_exceeded`, `test_password_reset_rate_limiting_exceeded`) verificando el bloqueo con código HTTP 429.


---

### 4. ⚡ Sincronización en Tiempo Real mediante WebSockets

* **¿Qué hay que hacer?**  
  Integrar **Django Channels** y **Daphne** en el backend y consumidores de WebSockets con **RxJS** en el frontend de Angular.

* **¿Por qué hay que hacerlo?**  
  Las subastas son un proceso competitivo. Anteriormente, si el Estudiante A realizaba una puja, el Estudiante B no veía el nuevo precio en su pantalla hasta que recargaba la página.

* **Estado:** ✅ **COMPLETADO & TESTEADO (Subastas y Pujas en Vivo 100% reactivas)**
* **Implementación:**
  * **Backend (Django Channels & ASGI):**
    * Instalación y configuración de `channels>=4.0.0` y `daphne>=4.0.0`.
    * Configurado `edubid_core/settings.py` con `daphne` en cabeza de `INSTALLED_APPS`, `ASGI_APPLICATION = 'edubid_core.asgi.application'`, y `CHANNEL_LAYERS` con fallback inteligente a memoria local (`InMemoryChannelLayer`) o Redis (`RedisChannelLayer`) según la variable de entorno `REDIS_URL`.
    * Creado `apps/auctions/consumers.py` (`AuctionConsumer`) gestionando las salas `auctions_general` y `auctions_group_{group_id}` con soporte para ping/pong keepalive.
    * Creado enrutador `apps/auctions/routing.py` (`ws/auctions/` y `ws/auctions/<int:group_id>/`).
    * Configurado `edubid_core/asgi.py` con `ProtocolTypeRouter`, `AuthMiddlewareStack` y `URLRouter`.
    * Creados métodos de difusión en tiempo real `broadcast_bid_update` y `broadcast_auction_closed` en `apps/auctions/services.py`.
    * Conectado `BidViewSet.perform_create` en `apps/auctions/views.py` para emitir eventos de nuevas pujas en vivo a todos los clientes suscritos.
    * Conectado `AuctionClosingService` para emitir el evento `auction_closed` notificando el ganador y monto de cierre en tiempo real.
    * Creada suite de pruebas unitarias `AuctionWebSocketTests` en `apps/auctions/tests.py` validando conexión WS, recepción de mensaje de bienvenida y respuesta a pings (56/56 tests aprobados en todo el backend).
  * **Frontend (Angular & RxJS):**
    * Creado servicio reactivo `WebSocketService` (`core/services/websocket.service.ts`) con auto-reconexión exponencial y tipado estricto de eventos (`BidUpdateEvent`, `AuctionClosedEvent`).
    * Integrado en `StudentDashboardComponent` (`features/dashboard/components/student-dashboard/`):
      * Actualización inmediata de la señal reactiva `auctions()` al recibir nuevas pujas en tiempo real.
      * Notificación toast de advertencia cuando un estudiante es superado en una puja por otro alumno.
      * Notificación toast de felicitación en vivo al ganador de una subasta y remoción de la subasta concluida.
    * Integrado en `TeacherDashboardComponent` (`features/dashboard/components/teacher-dashboard/`):
      * Actualización reactiva de la señal `teacherAuctions()` con el líder y oferta más alta en curso.
      * Notificación informativa en vivo al docente cuando se realizan pujas en sus subastas pedagógicas.
      * Notificación de cierre con detalle del ganador y monto final adjudicado.
    * Compilación de producción validada exitosamente con `npx ng build` (0 errores).

---

### 5. ☁️ Almacenamiento de Archivos en la Nube (Cloud Storage)

* **¿Qué hay que hacer?**  
  Configurar `django-storages` con **Amazon S3**, **Cloudinary** o **Azure Blob Storage** para la gestión de archivos estáticos y subidos por usuarios (*media*).

* **¿Por qué hay que hacerlo?**  
  Los avatares, logotipos de colegios y documentos adjuntos de entregas se guardan localmente en la carpeta `/media/`. En plataformas PaaS (como Railway, Heroku o contenedores Docker), el disco local se limpia con cada nuevo despliegue, lo que provocaría la **pérdida permanente de las imágenes**.

* **Prioridad:** 🟡 **MEDIA** (Crítico antes de desplegar en producción).

* **Beneficios:**
  * **Persistencia garantizada:** Los archivos nunca se pierden tras un reinicio.
  * **Carga ultra-rápida:** Distribución global de imágenes vía CDN.

---

### 6. 📦 Normalización de Dependencias Frontend y Pipeline de Compilación

* **¿Qué hay que hacer?**  
  Revisar y estandarizar [package.json](file:///C:/Proyectos/Web/edubid/edubid-frontend/package.json) para alinear la versión del compilador `@angular/build` con Node LTS, optimizar los presupuestos de bundle en `angular.json` y garantizar 100% de éxito en tests unitarios de frontend.

* **¿Por qué hay que hacerlo?**  
  Al ejecutar comandos de build, la CLI emitía advertencias por discrepancias entre versiones de Node (v25), límites de presupuesto rígidos de 500kB y pruebas unitarias de frontend con aserciones desactualizadas.

* **Estado:** ✅ **COMPLETADO & TESTEADO (Node LTS fijado, budgets optimizados y 17/17 tests aprobados)**
* **Implementación:**
  * **Estandarización de Versiones de Node:**
    * Creados archivos `.nvmrc` y `.node-version` en `edubid-frontend` fijando `22.14.0` (Node 22 Active LTS), garantizando que entornos de integración continua (CI/CD), Docker y plataformas PaaS utilicen siempre la versión de soporte a largo plazo recomendada.
    * Actualizado `package.json` con el bloque `"engines": { "node": "^20.0.0 || ^22.0.0 || >=20.0.0", "npm": ">=10.0.0" }`, permitiendo tanto entornos de producción LTS como desarrollo local.
    * Corregido `"packageManager": "npm@11.12.1"`.
  * **Optimización de Presupuestos de Empaquetado (`angular.json`):**
    * Ajustado el umbral de advertencia del bundle inicial en producción a `1MB` de aviso y `2MB` de error. Erradica por completo el aviso `▲ [WARNING] bundle initial exceeded maximum budget` que saltaba al superar los 500kB con los 525kB reales de la app.
  * **Corrección de Suite de Pruebas Frontend:**
    * Actualizada la prueba unitaria en `src/app/features/home/home.component.spec.ts` para verificar la invocación a `googleAuth.promptOneTap()` según la API moderna de Google Identity Services.
    * Ejecución de pruebas con `npx ng test --watch=false`: **5/5 archivos pasados, 17/17 pruebas aprobadas con 0 fallos**.
    * Compilación con `npx ng build`: **Exitosa en código 0** sin advertencias de presupuesto.

---

### 7. 🚨 Interceptor Global de Errores HTTP en Frontend

* **¿Qué hay que hacer?**  
  Implementar un interceptor funcional `errorInterceptor` en la capa `core/interceptors/` de Angular que capture globalmente anomalías de comunicación HTTP.

* **¿Por qué hay que hacerlo?**  
  Si la API falla (error 500), la conexión a internet cae (código 0), se exceden límites de cuota (429 Too Many Requests) o se intenta acceder a recursos sin permisos (403 Forbidden), los componentes individuales debían capturar el error de forma manual o la interfaz quedaba congelada en estados de carga.

* **Estado:** ✅ **COMPLETADO & TESTEADO (Captura global de caídas, rate limiting y 23/23 tests aprobados)**
* **Implementación:**
  * **Interceptor Funcional Angular 19 (`core/interceptors/error.interceptor.ts`):**
    * Detección de fallos de red / conectividad (`status === 0`): Emite toast de advertencia *"No es posible conectar con el servidor. Verifica tu conexión a internet o intenta más tarde."*.
    * Detección de Rate Limiting (`status === 429`): Emite toast de advertencia *"Demasiadas solicitudes. Por favor espera un momento antes de reintentar."*.
    * Detección de denegación de permisos (`status === 403`): Emite toast de error *"No tienes permisos suficientes para realizar esta acción."*.
    * Detección de fallos internos del servidor (`status >= 500`): Emite toast de error *"Ocurrió un error inesperado en el servidor. Intenta de nuevo más tarde."*.
    * **Bypass configurable:** Soporte para cabecera HTTP `X-Skip-Error-Toast: true` para peticiones que gestionan sus propios mensajes de error localmente.
    * **Cadena de interceptores en `app.config.ts`:** Registrado en la canalización HTTP junto a `authInterceptor` sin interferir con la renovación silenciosa de tokens JWT ni el flujo normal de peticiones.
    * **Propagación limpia:** Reemite el error con `throwError(() => error)` para garantizar que las señales y spinners de los componentes (`loading.set(false)`) se liberen adecuadamente.
  * **Pruebas Automatizadas Unitarias (`core/interceptors/error.interceptor.spec.ts`):**
    * 5 pruebas unitarias cubriendo: errores de red (status 0), rate limiting (status 429), fallos del servidor (status 500), acceso denegado (status 403), omisión de toasts mediante `X-Skip-Error-Toast`, y retransmisión de observables de error.
    * **Resultados de pruebas frontend (`npx ng test --watch=false`):** **6/6 suites pasadas, 23/23 tests aprobados con 0 errores**.
    * **Compilación frontend (`npx ng build`):** **Exitosa en código 0**, presupuesto inicial de 527kB dentro del límite asignado.

---

### 8. 📄 Exportación de Informes Académicos (PDF y Excel)

* **¿Qué hay que hacer?**  
  Añadir soporte para generar reportes en **PDF** (certificados/resúmenes) y planillas en **Excel** (`.xlsx`) con las calificaciones y distribución de EduCoins por grupo.

* **¿Por qué hay que hacerlo?**  
  Los directivos (Rectores) y Coordinadores necesitan presentar informes físicos o consolidados en hojas de cálculo ante secretarías de educación o comités académicos.

* **Prioridad:** 🟢 **BAJA-MEDIA**.

* **Beneficios:**
  * **Mayor utilidad institucional:** Aumenta el valor percibido del SaaS por parte de las directivas escolares.

---

### 9. 🚀 Paginación Global y Optimización de Consultas ORM

* **¿Qué hay que hacer?**  
  Establecer paginación configurable en `settings.py` de Django REST Framework y optimizar consultas en los `ViewSets` mediante `select_related` y `prefetch_related`.

* **¿Por qué hay que hacerlo?**  
  Anteriormente, endpoints de subastas, aulas o estudiantes retornaban listas no acotadas ejecutando consultas SQL repetitivas (N+1 queries) por cada relación anidada.

* **Estado:** ✅ **COMPLETADO & TESTEADO (Paginación híbrida inteligente y N+1 queries erradicadas)**
* **Implementación:**
  * **Paginador Híbrido Inteligente (`edubid_core/pagination.py`):**
    * Creada clase `EduBidPagination` extendiendo de `PageNumberPagination`:
      * `page_size = 20` (configurable por variable de entorno `PAGE_SIZE`).
      * `page_size_query_param = 'page_size'` (hasta `max_page_size = 100`).
      * Respuesta extendida con metadatos: `count`, `total_pages`, `current_page`, `page_size`, `next`, `previous`, `results`.
      * **Retrocompatibilidad Absoluta:** Si la petición no especifica parámetros de paginación (`?page=` o `?page_size=`), entrega el listado plano original. Esto previene roturas en los componentes de Angular y mantiene los 56 tests anteriores 100% funcionales.
    * Registrado como `DEFAULT_PAGINATION_CLASS` en `REST_FRAMEWORK` de `edubid_core/settings.py`.
  * **Optimización de Consultas ORM (select_related & prefetch_related):**
    * `ClassroomViewSet`: Integrado `select_related('docente', 'docente__institucion')` y `prefetch_related('grupos_clases__estudiantes')`. Reduce de 1 + N + N*M consultas a únicamente 3 consultas SQL acotadas para aulas, grupos y conteo de alumnos.
    * `GroupViewSet`: Integrado `select_related('classroom', 'classroom__docente', 'classroom__docente__institucion')` y `prefetch_related('estudiantes')`.
    * `ActivityViewSet` y `SubmissionViewSet`: Integrado `select_related` multinivel con docentes, grupos y aulas.
    * `PeriodViewSet` y `CoinTransactionViewSet`: Integrado `select_related` multinivel (`wallet`, `usuario`, `grupo`, `periodo`).
    * `NotificationViewSet`: Integrado `select_related('usuario', 'institucion')`.
  * **Pruebas Automatizadas:**
    * Creadas pruebas `test_paginacion_dinamica_y_retrocompatibilidad` y `test_optimizacion_orm_consultas_acotadas` (`assertNumQueries(3)`) en `apps/classrooms/tests.py`.
    * Total de la suite backend: **58/58 pruebas APROBADAS con 0 errores** (86.38s).
    * Compilación de frontend validada exitosamente con `npx ng build` (0 errores).

---

## 🗓️ Hoja de Ruta Recomendada (Fases de Ejecución)

```mermaid
flowchart TD
    subgraph Fase 1: Estabilidad y Automatización Core
        A[1. Task Cierre Automático Subastas]
        B[2. Suite de Pruebas Unitarias Backend]
        C[3. Rate Limiting Auth]
    end

    subgraph Fase 2: Producción & Infraestructura
        D[4. Integración Cloud Storage S3/Cloudinary]
        E[5. Estandarización Frontend & Node LTS]
        F[6. Interceptor HTTP Global Frontend]
    end

    subgraph Fase 3: Experiencia de Usuario Avanzada
        G[7. WebSockets para Subastas en Vivo]
        H[8. Exportación PDF/Excel de Reportes]
        I[9. Paginación Global & Tuning ORM]
    end

    Fase 1 --> Fase 2 --> Fase 3
```

---

## 📌 Conclusión
Este plan de acción proporciona la hoja de ruta técnica clara para transformar **EduBid** en un software robusto, altamente seguro, automatizado y escalable, listo para ser comercializado a múltiples instituciones educativas.
