import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <!-- Logo / Brand Header -->
        <div class="text-center mb-6">
          <a routerLink="/" class="inline-flex items-center gap-2">
            <div class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xl shadow-xs">
              E
            </div>
            <span class="text-2xl font-black tracking-tight text-slate-900 dark:text-neutral-100">
              Edu<span class="text-primary">Bid</span>
            </span>
          </a>
        </div>

        <div class="bg-surface py-8 px-6 shadow-sm border border-border sm:rounded-2xl sm:px-10">
          <!-- ESTADO 1: CARGANDO -->
          @if (status() === 'loading') {
            <div class="text-center py-6 space-y-4">
              <div class="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <svg class="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-slate-900 dark:text-neutral-100">
                Verificando tu cuenta
              </h2>
              <p class="text-sm text-text-muted">
                Por favor espera mientras confirmamos tu correo electrónico en EduBid...
              </p>
            </div>
          }

          <!-- ESTADO 2: ÉXITO -->
          @if (status() === 'success') {
            <div class="text-center py-6 space-y-4">
              <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-slate-900 dark:text-neutral-100">
                ¡Correo verificado con éxito!
              </h2>
              <p class="text-sm text-text-muted">
                Tu cuenta ha sido activada correctamente. Ya puedes acceder a la plataforma y explorar tus clases y subastas.
              </p>
              <div class="pt-4">
                <a
                  routerLink="/login"
                  class="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
                >
                  Iniciar Sesión
                </a>
              </div>
            </div>
          }

          <!-- ESTADO 3: ERROR / EXPIRADO -->
          @if (status() === 'error') {
            <div class="text-center py-4 space-y-4">
              <div class="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-slate-900 dark:text-neutral-100">
                Enlace no válido o expirado
              </h2>
              <p class="text-sm text-text-muted">
                {{ errorMessage() }}
              </p>

              <!-- Formulario de reenvío -->
              <div class="mt-6 pt-6 border-t border-border text-left space-y-3">
                <label for="resendEmail" class="block text-xs font-semibold text-text-muted">
                  Ingresa tu correo para reenviar la verificación:
                </label>
                <div class="flex gap-2">
                  <input
                    id="resendEmail"
                    type="email"
                    [(ngModel)]="emailToResend"
                    placeholder="tu-correo@ejemplo.com"
                    class="flex-1 px-3 py-2 bg-bg border border-border rounded-xl text-sm text-text placeholder:text-text-muted/60 focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    (click)="onResend()"
                    [disabled]="!emailToResend.trim() || isResending()"
                    class="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    @if (isResending()) {
                      <span>Enviando...</span>
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

              <div class="pt-4 flex flex-col sm:flex-row gap-2">
                <a
                  routerLink="/login"
                  class="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-text bg-bg hover:bg-black/5 dark:hover:bg-white/5 border border-border text-center transition-colors cursor-pointer"
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
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  status = signal<'loading' | 'success' | 'error'>('loading');
  errorMessage = signal<string>('El enlace de verificación es inválido o ha expirado.');
  emailToResend = '';
  isResending = signal(false);
  resendSuccess = signal(false);
  resendFeedback = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.status.set('error');
      this.errorMessage.set('No se encontró el token de verificación en el enlace recibido.');
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (_res) => {
        this.status.set('success');
      },
      error: (err) => {
        this.status.set('error');
        const detail = err.error?.detail || err.error?.message || 'El enlace de verificación no es válido o ya ha sido utilizado.';
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
      next: (res) => {
        this.isResending.set(false);
        this.resendSuccess.set(true);
        this.resendFeedback.set(res.message || 'Se ha enviado un nuevo enlace a tu correo. Revisa tu bandeja y spam.');
      },
      error: (err) => {
        this.isResending.set(false);
        this.resendSuccess.set(false);
        this.resendFeedback.set(err.error?.detail || err.error?.message || 'Error al reenviar el correo. Verifica que esté registrado.');
      },
    });
  }
}
