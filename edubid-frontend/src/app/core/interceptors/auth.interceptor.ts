import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, Subject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { STORAGE_KEYS } from '../constants/api.constants';

let isRefreshing = false;
const refreshSubject = new Subject<string>();

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (isPublicEndpoint(req.url)) {
    return next(req);
  }

  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('token/refresh') && !req.url.includes('_retry=true')) {
        return handle401Error(req, next, authService, router);
      }

      if (error.status === 403) {
        router.navigate(['/dashboard']);
      }

      return throwError(() => error);
    })
  );
};

function handle401Error(
  req: Parameters<HttpInterceptorFn>[0],
  next: Parameters<HttpInterceptorFn>[1],
  authService: AuthService,
  router: Router
) {
  if (!isRefreshing) {
    isRefreshing = true;

    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      isRefreshing = false;
      authService.logoutAndNotify();
      return throwError(() => new Error('No refresh token'));
    }

    return authService.refreshAccessToken().pipe(
      switchMap((tokenRes) => {
        isRefreshing = false;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenRes.access);

        refreshSubject.next(tokenRes.access);
        refreshSubject.complete();

        const retryUrl = req.url + (req.url.includes('?') ? '&' : '?') + '_retry=true';
        const retryReq = req.clone({
          url: retryUrl,
          setHeaders: { Authorization: `Bearer ${tokenRes.access}` },
        });

        return next(retryReq);
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        refreshSubject.error(refreshError);
        authService.logoutAndNotify();
        return throwError(() => refreshError);
      })
    );
  }

  return refreshSubject.pipe(
    filter((token) => !!token),
    take(1),
    switchMap((newToken) => {
      const retryReq = req.clone({
        setHeaders: { Authorization: `Bearer ${newToken}` },
      });
      return next(retryReq);
    })
  );
}

function isPublicEndpoint(url: string): boolean {
  const publicPaths = [
    '/users/login/',
    '/users/register/',
    '/users/google/',
    '/users/token/refresh/',
    '/users/verify-email/',
    '/users/password-reset/',
    '/users/password-reset-confirm/',
    '/institutions/public/',
  ];
  return publicPaths.some((path) => url.includes(path));
}
