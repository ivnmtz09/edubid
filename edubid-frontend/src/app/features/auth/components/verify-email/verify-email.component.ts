import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-bg flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      <!-- HEADER OFICIAL EDUBID -->
      <header class="w-full border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-2.5 group cursor-pointer">
            <div class="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-xs group-hover:scale-105 transition-transform">
              E
            </div>
            <span class="text-xl font-black tracking-tight text-slate-900 dark:text-neutral-100">
              Edu<span class="text-primary">Bid</span>
            </span>
          </a>

          <div class="flex items-center gap-3">
            <!-- Botón ciclo de tema claro/oscuro -->
            <button
              type="button"
              (click)="themeService.cycleTheme()"
              class="p-2 rounded-xl border border-border text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              [title]="'Cambiar tema (actual: ' + themeService.mode() + ')'"
            >
              @if (themeService.isDark()) {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              }
            </button>

            <a
              routerLink="/"
              class="text-xs font-semibold text-text-muted hover:text-text transition-colors py-2 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              Volver al Inicio
            </a>
          </div>
        </div>
      </header>

      <!-- CONTENIDO PRINCIPAL -->
      <main class="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div class="w-full max-w-md">
          <div class="bg-surface py-8 px-6 sm:px-10 rounded-2xl shadow-sm border border-border">
            
            <!-- ESTADO 1: CARGANDO -->
            @if (status() === 'loading') {
              <div class="text-center py-6 space-y-4 animate-in fade-in duration-300">
                <div class="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <svg class="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </div>
                <h2 class="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
                  Verificando tu cuenta
                </h2>
                <p class="text-xs text-text-muted leading-relaxed max-w-xs mx-auto">
                  Por favor espera un momento mientras confirmamos tu correo electrónico en EduBid...
                </p>
              </div>
            }

            <!-- ESTADO 2: ÉXITO -->
            @if (status() === 'success') {
              <div class="text-center py-6 space-y-5 animate-in fade-in duration-300">
                <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
                    ¡Correo verificado con éxito!
                  </h2>
                  <p class="text-xs text-text-muted mt-2 leading-relaxed">
                    Tu cuenta ha sido activada correctamente. Ya puedes acceder a la plataforma para gestionar tus clases, actividades y subastas.
                  </p>
                </div>
                <div class="pt-2">
                  <a
                    routerLink="/login"
                    class="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
                  >
                    Iniciar Sesión
                  </a>
                </div>
              </div>
            }

            <!-- ESTADO 3: ERROR DE CONEXIÓN / BACKEND OFFLINE -->
            @if (status() === 'network_error') {
              <div class="text-center py-5 space-y-5 animate-in fade-in duration-300">
                <div class="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829M3 3l18 18" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
                    Problema de conexión con el servidor
                  </h2>
                  <p class="text-xs text-text-muted mt-2 leading-relaxed">
                    No pudimos comunicar con el servidor backend de EduBid. Verifica que el backend esté en ejecución y presiona el botón para reintentar.
                  </p>
                </div>
                <div class="pt-2 flex flex-col gap-2.5">
                  <button
                    type="button"
                    (click)="verify()"
                    class="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reintentar verificación
                  </button>
                  <a
                    routerLink="/"
                    class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-text-muted hover:text-text text-center transition-colors cursor-pointer"
                  >
                    Volver al Inicio
                  </a>
                </div>
              </div>
            }

            <!-- ESTADO 4: TOKEN EXPIRADO O INVÁLIDO -->
            @if (status() === 'error') {
              <div class="text-center py-4 space-y-4 animate-in fade-in duration-300">
                <div class="w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-xs">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
                    Enlace no válido o expirado
                  </h2>
                  <p class="text-xs text-text-muted mt-1.5 leading-relaxed">
                    {{ errorMessage() }}
                  </p>
                </div>

                <!-- Formulario de reenvío de enlace -->
                <div class="mt-4 pt-4 border-t border-border text-left space-y-3">
                  <label for="verify-resend-email" class="block text-xs font-semibold text-text-muted">
                    Ingresa tu correo para reenviar la verificación:
                  </label>
                  <div class="flex gap-2">
                    <input
                      id="verify-resend-email"
                      type="email"
                      [(ngModel)]="emailToResend"
                      placeholder="tu-correo@ejemplo.com"
                      class="flex-1 px-3 py-2 bg-bg border border-border rounded-xl text-xs text-text placeholder:text-text-muted/60 focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      (click)="onResend()"
                      [disabled]="!emailToResend.trim() || isResending() || cooldown() > 0"
                      class="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      @if (isResending()) {
                        <span>Enviando...</span>
                      } @else if (cooldown() > 0) {
                        <span>{{ cooldown() }}s</span>
                      } @else {
                        <span>Reenviar</span>
                      }
                    </button>
                  </div>

                  @if (resendFeedback()) {
                    <p
                      class="text-xs mt-2"
                      [class.text-emerald-600]="resendSuccess()"
                      [class.dark:text-emerald-400]="resendSuccess()"
                      [class.text-red-600]="!resendSuccess()"
                      [class.dark:text-red-400]="!resendSuccess()"
                    >
                      {{ resendFeedback() }}
                    </p>
                  }
                </div>

                <div class="pt-3 flex flex-col sm:flex-row gap-2">
                  <a
                    routerLink="/login"
                    class="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover text-center transition-colors cursor-pointer"
                  >
                    Ir al Login
                  </a>
                  <a
                    routerLink="/"
                    class="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-text-muted hover:text-text text-center transition-colors cursor-pointer"
                  >
                    Volver al Inicio
                  </a>
                </div>
              </div>
            }

          </div>
        </div>
      </main>

      <!-- FOOTER SENCILLO -->
      <footer class="w-full py-4 text-center text-xs text-text-muted border-t border-border">
        EduBid — Gamificación educativa y subastas dinámicas
      </footer>
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  readonly themeService = inject(ThemeService);

  status = signal<'loading' | 'success' | 'network_error' | 'error'>('loading');
  errorMessage = signal<string>('El enlace de verificación es inválido o ha expirado.');
  emailToResend = '';
  isResending = signal(false);
  resendSuccess = signal(false);
  resendFeedback = signal<string | null>(null);
  cooldown = signal(0);
  private cooldownTimer: any = null;

  ngOnInit(): void {
    this.verify();
  }

  verify(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.status.set('error');
      this.errorMessage.set('No se encontró el token de verificación en el enlace recibido.');
      return;
    }

    this.status.set('loading');

    this.authService.verifyEmail(token).subscribe({
      next: (_res) => {
        this.status.set('success');
      },
      error: (err) => {
        // 1. Error de conexión con el servidor (backend caído o Vite reconectando)
        const isNetworkFailure =
          err.status === 0 ||
          err.error?.message === 'Failed to fetch' ||
          err.message?.includes('Failed to fetch') ||
          err.message?.includes('0 Unknown Error');

        if (isNetworkFailure) {
          this.status.set('network_error');
          return;
        }

        // 2. Si el backend responde que el usuario ya está verificado, es un éxito
        const isAlreadyVerified =
          err.error?.already_verified ||
          err.error?.detail?.includes('ya está verificado') ||
          err.error?.message?.includes('ya ha sido verificado');

        if (isAlreadyVerified) {
          this.status.set('success');
          return;
        }

        // 3. Token inválido o expirado real
        this.status.set('error');
        const detail =
          err.error?.detail ||
          err.error?.message ||
          'El enlace de verificación no es válido o ha expirado.';
        this.errorMessage.set(detail);
      },
    });
  }

  onResend(): void {
    const email = this.emailToResend.trim();
    if (!email) return;

    this.isResending.set(true);
    this.resendFeedback.set(null);

    this.authService.resendVerification(email).subscribe({
      next: (res: any) => {
        this.isResending.set(false);
        this.resendSuccess.set(true);
        if (res.already_verified) {
          this.resendFeedback.set('Tu correo ya se encuentra verificado. Ya puedes iniciar sesión con tu cuenta.');
        } else {
          this.resendFeedback.set(res.message || 'Se ha enviado un nuevo enlace a tu correo. Revisa tu bandeja y spam.');
          this.startCooldown();
        }
      },
      error: (err) => {
        this.isResending.set(false);
        if (err.error?.already_verified || err.error?.detail?.includes('ya está verificado')) {
          this.resendSuccess.set(true);
          this.resendFeedback.set('Tu correo ya está verificado. Ya puedes iniciar sesión.');
          return;
        }
        this.resendSuccess.set(false);
        this.resendFeedback.set(err.error?.detail || err.error?.message || 'Error al reenviar el correo. Verifica que esté registrado.');
      },
    });
  }

  private startCooldown(seconds = 60): void {
    this.cooldown.set(seconds);
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      this.cooldown.update((c) => {
        if (c <= 1) {
          clearInterval(this.cooldownTimer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }
}
