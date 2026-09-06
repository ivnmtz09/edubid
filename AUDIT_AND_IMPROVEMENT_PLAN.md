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
| **3** | Rate Limiting y Protección de Endpoints Auth | Backend / Seguridad | 🟡 **MEDIA-ALTA** | Ataques de fuerza bruta, spam de usuarios, denegación de servicio (DoS) | Bajo |
| **4** | Sincronización Real-Time con WebSockets | Backend / Frontend | 🟡 **MEDIA** | Subastas lentas, requiere refrescar la página manualmente para ver pujas | Alto |
| **5** | Almacenamiento Nube para Archivos Media (S3/Cloudinary) | DevOps / Backend | 🟡 **MEDIA** | Pérdida de imágenes y tareas adjuntas al reiniciar contenedores en producción | Medio |
| **6** | Normalización de Dependencias Frontend & Build | Frontend | 🟡 **MEDIA** | Incompatibilidades de compilación CLI, builds de producción pesados | Bajo |
| **7** | Interceptor Global de Errores HTTP | Frontend | 🟢 **BAJA-MEDIA** | Interfaz rota o congelada cuando ocurre un error 500 o caída de red | Bajo |
| **8** | Módulo de Exportación de Reportes (PDF / Excel) | Backend / Frontend | 🟢 **BAJA-MEDIA** | Fricción para directivos que requieren informes físicos/impresos | Medio |
| **9** | Paginación Global y Optimización ORM | Backend | 🟢 **BAJA-MEDIA** | Lentitud en la API cuando la plataforma tenga miles de usuarios | Bajo |

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

* **Estado:** ✅ **COMPLETADO & TESTEADO (29/29 tests aprobados en apps core)**
* **Implementación:**
  * **`apps/users/tests.py` (7 tests):** Restricciones de SuperAdmin (aislamiento estricto `institucion = None`), regla de unicidad `UniqueConstraint` para un solo rector por institución, 5 roles del RBAC, perfiles automáticos vía signal y permisos `IsDocente`, `AdminOrDocente`.
  * **`apps/tokens/tests.py` (6 tests):** Operaciones financieras en `Wallet` (`depositar`, `gastar` con prevención de saldo negativo, `resetear`), auditoría mediante `CoinTransaction` y ciclo de vida de periodos/cortes (`Period.activar()`).
  * **`apps/grades/tests.py` (5 tests):** Cálculo proporcional de EduCoins sobre experiencia de actividad, bonificación del 10% por excelencia académica, acreditación automática a billetera vía señal `post_save` y prevención de doble calificación.
  * **`apps/groups/tests.py` (6 tests):** Generación automática de códigos alfanuméricos de 6 caracteres, matrícula de estudiantes con auto-provisión de `Wallet`, prevención de dobles inscripciones y aislamiento de datos por institución y rol.
  * **`apps/auctions/tests.py` (5 tests):** Cierre y liquidación de subastas, transacciones de compra, devoluciones a postores no ganadores y comando CLI.

---

### 3. 🛡️ Rate Limiting y Protección de Endpoints de Autenticación

* **¿Qué hay que hacer?**  
  Configurar la aceleración de peticiones (*Throttling*) en Django REST Framework utilizando `AnonRateThrottle` y `ScopedRateThrottle`.

* **¿Por qué hay que hacerlo?**  
  Los endpoints de inicio de sesión (`/login/`), registro (`/register/`), inicio con Google (`/google/`) y recuperación de contraseña no tienen límites de intentos. Un bot maligno podría realizar miles de peticiones por segundo para adivinar contraseñas o saturar el servidor.

* **Prioridad:** 🟡 **MEDIA-ALTA** (Requisito indispensable de ciberseguridad).

* **Beneficios:**
  * **Protección contra Fuerza Bruta:** Bloquea IP o usuarios tras un número de intentos fallidos.
  * **Estabilidad del Servidor:** Evita que scripts maliciosos tumben la API.

---

### 4. ⚡ Sincronización en Tiempo Real mediante WebSockets

* **¿Qué hay que hacer?**  
  Integrar **Django Channels** en el backend y consumidores de WebSockets con **RxJS** en el frontend.

* **¿Por qué hay que hacerlo?**  
  Las subastas son un proceso competitivo. Actualmente, si el Estudiante A realiza una puja, el Estudiante B no ve el nuevo precio en su pantalla hasta que recarga la página o se realiza una petición HTTP.

* **Prioridad:** 🟡 **MEDIA** (Mejora dramática de la experiencia de juego).

* **Beneficios:**
  * **Pujas en vivo:** Los estudiantes ven el contador de la subasta y las ofertas subir al instante sin recargar.
  * **Notificaciones instantáneas:** Notificación inmediata en pantalla cuando un usuario es superado en una puja.

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
  Revisar y estandarizar [package.json](file:///C:/Proyectos/Web/edubid/edubid-frontend/package.json) para alinear la versión del compilador `@angular/build` con Node LTS, realizando un `npm install` limpio.

* **¿Por qué hay que hacerlo?**  
  Al ejecutar comandos de build, la CLI emitió advertencias por discrepancias entre versiones de Node (v25) y módulos dev.

* **Prioridad:** 🟡 **MEDIA**.

* **Beneficios:**
  * **Compilación fluida:** Previene fallos en entornos de Integración Continua (CI/CD).
  * **Builds optimizados:** Reduce el tamaño de los paquetes JavaScript finales.

---

### 7. 🚨 Interceptor Global de Errores HTTP en Frontend

* **¿Qué hay que hacer?**  
  Implementar un `HttpErrorInterceptor` en la capa `core/interceptors/` de Angular.

* **¿Por qué hay que hacerlo?**  
  Si la API falla (error 500) o la conexión a internet cae, los componentes individuales deben manejar el error. Sin un interceptor global, algunas pantallas se quedan cargando infinitamente sin dar información al usuario.

* **Prioridad:** 🟢 **BAJA-MEDIA**.

* **Beneficios:**
  * **UX Profesional:** Muestra notificaciones limpias (*Toastr*) como *"Conexión perdida con el servidor"* o *"Ocurrió un error inesperado, reintentando..."*.

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
  Establecer paginación por defecto (`PageNumberPagination`) en `settings.py` de Django REST Framework y optimizar consultas en los `ViewSets` mediante `select_related` y `prefetch_related`.

* **¿Por qué hay que hacerlo?**  
  Actualmente, endpoints como la lista de subastas o la lista de estudiantes retornan todos los registros de una sola vez. Con 5,000 estudiantes, la respuesta JSON sería demasiado pesada.

* **Prioridad:** 🟢 **BAJA-MEDIA**.

* **Beneficios:**
  * **Tiempos de respuesta inferiores a 100ms.**
  * **Menor consumo de RAM** en el servidor de base de datos.

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
