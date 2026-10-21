/**
 * Utilidad para generar saludos personalizados según la hora del día.
 *
 * Franjas horarias:
 * - 05:00 a 11:59: Mañana ("Buenos días")
 * - 12:00 a 18:59: Tarde ("Buenas tardes")
 * - 19:00 a 04:59: Noche ("Buenas noches")
 */

export function getTimeBasedSalutation(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Buenos días';
  } else if (hour >= 12 && hour < 19) {
    return 'Buenas tardes';
  } else {
    return 'Buenas noches';
  }
}

export function getTimeBasedSubtitle(role?: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    switch (role) {
      case 'docente':
        return 'Comienza tu jornada pedagógica organizando tus asignaturas y reconociendo el mérito de tus alumnos.';
      case 'estudiante':
        return '¡Excelente mañana para aprender! Revisa tus tareas pendientes y acumula EduCoins.';
      case 'rector':
      case 'coordinador':
        return 'Monitorea el pulso académico y directivo de tu institución al inicio de la jornada.';
      case 'admin':
        return 'Supervisa el ecosistema global de instituciones y el rendimiento de la plataforma.';
      default:
        return 'Que tengas una excelente y productiva jornada en EduBid.';
    }
  } else if (hour >= 12 && hour < 19) {
    switch (role) {
      case 'docente':
        return 'Continúa impulsando a tus estudiantes: califica entregas y dinamiza tus subastas de aula.';
      case 'estudiante':
        return 'Sigue sumando méritos escolares y consulta las subastas pedagógicas activas.';
      case 'rector':
      case 'coordinador':
        return 'Supervisión en tiempo real de actividades, docentes e indicadores institucionales.';
      case 'admin':
        return 'Gestión multi-inquilino, auditoría y administración de centros educativos.';
      default:
        return 'Continúa con éxito tus actividades escolares en EduBid.';
    }
  } else {
    switch (role) {
      case 'docente':
        return 'Cierra tu día formativo revisando métricas clave y preparando nuevos incentivos de aprendizaje.';
      case 'estudiante':
        return 'Buen momento para repasar tus logros del día y planificar tus metas escolares de mañana.';
      case 'rector':
      case 'coordinador':
        return 'Consolidado general y métricas de cierre de jornada institucional.';
      case 'admin':
        return 'Auditoría nocturna del sistema y monitoreo de actividad global.';
      default:
        return 'Gracias por ser parte activa de la comunidad EduBid.';
    }
  }
}

export function formatTimeGreeting(name?: string | null, prefix?: string): string {
  const salutation = getTimeBasedSalutation();
  const cleanName = name?.trim();
  if (!cleanName) {
    return salutation;
  }
  if (prefix) {
    return `${salutation}, ${prefix} ${cleanName}`;
  }
  return `${salutation}, ${cleanName}`;
}
