import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

// Tipos globales del SDK de Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
          prompt: (notification?: (n: PromptNotification) => void) => void;
          disableAutoSelect: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
}

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number | string;
  locale?: string;
}

interface PromptNotification {
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  getDismissedReason: () => string;
}

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private router = inject(Router);

  /** Señal de carga durante el proceso de login con Google */
  readonly isLoading = signal(false);
  /** Señal de error para mostrar al usuario */
  readonly errorMessage = signal<string | null>(null);

  private initialized = false;

  /**
   * Inicializa Google Identity Services.
   * Debe llamarse una sola vez (en AppComponent o en el primer componente que use Google Auth).
   */
  initialize(): void {
    if (this.initialized) return;

    if (!environment.googleClientId) {
      console.warn('[GoogleAuthService] Google Client ID no configurado en environment.');
      return;
    }

    // Si el SDK aún no cargó, esperamos hasta que esté disponible
    const tryInit = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response) => {
            this.ngZone.run(() => this.handleCredential(response.credential));
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
        });
        this.initialized = true;
      } else {
        // Reintenta cada 200 ms hasta que cargue el script (máx. 10 seg)
        setTimeout(tryInit, 200);
      }
    };

    tryInit();
  }

  /**
   * Renderiza el botón nativo de Google dentro del elemento indicado.
   * Llama a `initialize()` automáticamente si aún no se hizo.
   */
  renderButton(
    element: HTMLElement,
    options: GoogleButtonOptions = {}
  ): void {
    if (!environment.googleClientId) return;

    const tryRender = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        if (!this.initialized) this.initialize();
        window.google!.accounts.id.renderButton(element, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: element.offsetWidth || 400,
          ...options,
        });
      } else {
        setTimeout(tryRender, 200);
      }
    };

    tryRender();
  }

  /**
   * Activa el flujo One Tap de Google.
   * Solo funciona con orígenes HTTPS o localhost en la consola de Google.
   */
  promptOneTap(): void {
    if (!environment.googleClientId || typeof window === 'undefined') return;

    const tryPrompt = () => {
      if (window.google?.accounts?.id) {
        if (!this.initialized) this.initialize();
        window.google!.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // One Tap no disponible o ignorado por el usuario: silencioso
          }
        });
      } else {
        setTimeout(tryPrompt, 200);
      }
    };

    tryPrompt();
  }

  /**
   * Procesa el id_token recibido desde Google y lo envía al backend.
   */
  private handleCredential(idToken: string): void {
    if (!idToken) {
      this.errorMessage.set('No se recibió token de Google. Intenta de nuevo.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.loginWithGoogle(idToken).subscribe({
      next: () => {
        this.isLoading.set(false);
        // AuthService ya maneja la navegación y el almacenamiento de tokens
      },
      error: (err) => {
        this.isLoading.set(false);
        const status = err?.status;
        const msg = err?.error?.detail || err?.error?.message;

        if (status === 0) {
          this.errorMessage.set('No se pudo conectar al servidor. Verifica que el backend esté activo.');
        } else if (status === 400) {
          this.errorMessage.set(msg || 'Token de Google inválido o expirado. Intenta de nuevo.');
        } else {
          this.errorMessage.set(msg || 'Error al iniciar sesión con Google. Intenta de nuevo.');
        }
      },
    });
  }
}
