import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const institutionScopeGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  const slug = route.paramMap.get('slug');
  const user = authService.currentUser();

  // Si no está autenticado, se le permite ver las pantallas públicas de la institución
  if (!user) {
    return true;
  }

  // Superadmin global tiene acceso libre
  if (user.role === 'admin') {
    return true;
  }

  // Si el usuario ya está autenticado y su institución coincide con el slug,
  // si intenta entrar a login/registro lo redirigimos a su panel
  const isAuthRoute = route.routeConfig?.path === 'login' ||
                      route.routeConfig?.path === 'registro' ||
                      route.routeConfig?.path === 'registro-docente';

  const userInstSlug = user.profile?.institucion?.slug;

  if (userInstSlug === slug) {
    if (isAuthRoute) {
      return router.createUrlTree(['/dashboard']);
    }
    return true;
  }

  // Conflicto de aislamiento: El usuario pertenece a otra institución
  notificationService.error(
    `Tu cuenta pertenece a "${user.profile?.institucion?.nombre || 'otra institución'}". No tienes permiso para interactuar en este portal.`,
    'Acceso Restringido'
  );
  return router.createUrlTree(['/dashboard']);
};
