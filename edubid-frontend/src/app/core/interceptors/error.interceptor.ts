import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/**
 * Interceptor global para gestión centralizada de errores HTTP en EduBid.
 * Captura fallos de infraestructura (status 0), rate limiting (429),
 * errores de servidor (5xx) y permisos insuficientes (403).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Permitir suprimir la notificación toast global si la petición incluye el header X-Skip-Error-Toast
      if (req.headers.has('X-Skip-Error-Toast')) {
        return throwError(() => error);
      }

      // 1. Error de red / Servidor caído / Timeout (status 0)
      if (error.status === 0) {
        notificationService.error(
          'No se pudo conectar con el servidor. Verifica tu conexión a internet o intenta más tarde.',
          'Error de Conexión'
        );
      }
      // 2. Límite de peticiones excedido (Rate Limiting / Throttling - status 429)
      else if (error.status === 429) {
        const detail =
          error.error?.detail ||
          'Has superado el límite de intentos permitidos. Por favor, espera un minuto antes de reintentar.';
        notificationService.warning(detail, 'Límite Excedido');
      }
      // 3. Error interno del servidor (status 500 a 599)
      else if (error.status >= 500 && error.status <= 599) {
        notificationService.error(
          'Ocurrió un error inesperado en el servidor. Por favor, inténtalo de nuevo más tarde.',
          'Error del Servidor'
        );
      }
      // 4. Acceso prohibido / Permisos insuficientes (status 403)
      else if (error.status === 403) {
        const detail =
          error.error?.detail ||
          'No tienes permisos suficientes para realizar esta acción.';
        notificationService.error(detail, 'Acceso Denegado');
      }

      // Siempre retransmitir el error para que los componentes puedan actualizar su estado (apagar spinners, etc.)
      return throwError(() => error);
    })
  );
};

