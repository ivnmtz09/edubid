import { Injectable, inject, signal, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, Subject, tap, catchError, throwError } from 'rxjs';
import {
  User,
  AuthTokens,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  GoogleLoginRequest,
  TokenRefreshResponse,
  UserRole,
} from '../models/user.model';
import { AUTH_ENDPOINTS, STORAGE_KEYS, USER_ROLES } from '../constants/api.constants';
import { ThemeService } from './theme.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private themeService = inject(ThemeService);

  private _user = signal<User | null>(null);
  private _isAuthenticated = signal<boolean>(false);
  private _isLoading = signal<boolean>(false);

  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  private logoutSubject = new Subject<void>();
  logout$ = this.logoutSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, credentials).pipe(
      tap((res) => this.handleAuthSuccess(res)),
      catchError((err) => {
        this.handleAuthError(err);
        return throwError(() => err);
      })
    );
  }

  loginWithGoogle(idToken: string): Observable<LoginResponse> {
    const body: GoogleLoginRequest = { id_token: idToken };
    return this.http.post<LoginResponse>(AUTH_ENDPOINTS.GOOGLE_LOGIN, body).pipe(
      tap((res) => {
        this.handleAuthSuccess(res);
        if (res.user.role !== 'admin' && !res.user.profile?.institucion) {
          this.router.navigate(['/completar-perfil']);
        }
      }),
      catchError((err) => {
        this.handleAuthError(err);
        return throwError(() => err);
      })
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    const payload = {
      ...data,
      institucion_id: data.institucion_id ?? data.institution ?? null,
    };
    return this.http.post<RegisterResponse>(AUTH_ENDPOINTS.REGISTER, payload);
  }

  logout(): void {
    this.removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
    this.removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
    this.removeStorageItem(STORAGE_KEYS.USER);
    this._user.set(null);
    this._isAuthenticated.set(false);
    this.router.navigate(['/']);
  }

  logoutAndNotify(): void {
    this.logout();
    this.logoutSubject.next();
  }

  refreshAccessToken(): Observable<TokenRefreshResponse> {
    const refreshToken = this.getStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    return this.http.post<TokenRefreshResponse>(AUTH_ENDPOINTS.TOKEN_REFRESH, {
      refresh: refreshToken,
    });
  }

  getProfile(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(AUTH_ENDPOINTS.PROFILE).pipe(
      tap((res) => {
        this._user.set(res.user);
        this.storeUser(res.user);
      })
    );
  }

  getToken(): string | null {
    return this.getStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  getUserRole(): UserRole | null {
    return this._user()?.role ?? null;
  }

  private handleAuthSuccess(res: LoginResponse): void {
    if (res.user.role === 'admin' && res.user.profile) {
      res.user.profile.institucion = null;
    }
    this.storeTokens(res.tokens);
    this.storeUser(res.user);
    this._user.set(res.user);
    this._isAuthenticated.set(true);
    const brand = res.user.role === 'admin' ? null : (res.user.profile?.institucion ?? null);
    this.themeService.injectBrandColors(brand);
    this.navigateByRole(res.user.role);
  }

  private handleAuthError(_err: unknown): void {
    // Errores manejados por el componente
  }

  private storeTokens(tokens: AuthTokens): void {
    this.setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
    this.setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
  }

  private storeUser(user: User): void {
    const safeUser = this.sanitizeUser(user);
    this.setStorageItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
  }

  private sanitizeUser(user: User): Partial<User> {
    const { ...safeUser } = user;
    if (safeUser.role === 'admin' && safeUser.profile) {
      safeUser.profile = {
        ...safeUser.profile,
        institucion: null,
      };
    }
    return safeUser;
  }

  private loadUserFromStorage(): void {
    const token = this.getStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
    const userJson = this.getStorageItem(STORAGE_KEYS.USER);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        if (user.role === 'admin' && user.profile) {
          user.profile.institucion = null;
        }
        this._user.set(user);
        this._isAuthenticated.set(true);
        const brand = user.role === 'admin' ? null : (user.profile?.institucion ?? null);
        this.themeService.injectBrandColors(brand);
      } catch {
        this.logout();
      }
    }
  }

  private getStorageItem(key: string): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return null;
  }

  private setStorageItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch {}
    }
  }

  private removeStorageItem(key: string): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  }

  private navigateByRole(role: UserRole): void {
    const routeMap: Record<UserRole, string[]> = {
      [USER_ROLES.ADMIN]: ['/dashboard'],
      [USER_ROLES.RECTOR]: ['/dashboard/rector'],
      [USER_ROLES.COORDINATOR]: ['/dashboard'],
      [USER_ROLES.TEACHER]: ['/dashboard'],
      [USER_ROLES.STUDENT]: ['/dashboard'],
    };
    const target = routeMap[role] ?? ['/dashboard'];
    this.ngZone.run(() => this.router.navigate(target));
  }
}
