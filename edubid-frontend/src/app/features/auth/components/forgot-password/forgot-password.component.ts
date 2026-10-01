import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 bg-bg">
      <!-- Fondo decorativo -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-5" style="background: var(--brand-primary);"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5" style="background: var(--brand-accent);"></div>
      </div>

      <div class="w-full max-w-md relative z-10">
        <!-- Logo / Branding -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style="background: var(--brand-primary);">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-neutral-100">Recuperar Contraseña</h1>
          <p class="text-sm text-text-muted mt-1">Ingresa tu correo y te enviaremos un enlace para restablecer tu clave.</p>
        </div>

        <!-- Tarjeta Principal -->
        <div class="bento-card p-8">

          @if (!emailSent()) {
            <!-- Formulario de Solicitud -->
            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">

              @if (error()) {
                <div class="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs">
                  <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {{ error() }}
                </div>
              }

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-text-muted uppercase tracking-wide">Correo Electrónico</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/></svg>
                  </span>
                  <input
                    type="email"
                    formControlName="email"
                    placeholder="tu@correo.com"
                    class="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:ring-2 focus:outline-none transition-all"
                    style="focus-ring-color: var(--brand-primary);"
                    [class.border-red-400]="form.get('email')?.invalid && form.get('email')?.touched"
                  />
                </div>
                @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
                  <p class="text-[11px] text-red-500 font-medium">El correo es requerido.</p>
                }
                @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                  <p class="text-[11px] text-red-500 font-medium">Ingresa un correo electrónico válido.</p>
                }
              </div>

              <button
                type="submit"
                [disabled]="form.invalid || isLoading()"
                class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                style="background: var(--brand-primary);"
              >
                @if (isLoading()) {
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Enviando...</span>
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  <span>Enviar enlace de recuperación</span>
                }
              </button>
            </form>

          } @else {
            <!-- Estado de Éxito -->
            <div class="text-center space-y-4">
              <div class="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mx-auto">
                <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"/>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 dark:text-neutral-100 text-base">¡Revisa tu correo!</h3>
                <p class="text-xs text-text-muted mt-1 leading-relaxed">
                  Si la dirección <span class="font-semibold text-text">{{ form.value.email }}</span> está registrada,
                  te hemos enviado un enlace para restablecer tu contraseña.
                </p>
                <p class="text-[11px] text-text-muted mt-2">
                  No olvides revisar la carpeta de <strong>Spam o Correo No Deseado</strong>.
                </p>
              </div>

              @if (countdown() > 0) {
                <button
                  type="button"
                  disabled
                  class="w-full py-2 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-text-muted cursor-not-allowed"
                >
                  Reenviar en {{ countdown() }}s...
                </button>
              } @else {
                <button
                  type="button"
                  (click)="resend()"
                  [disabled]="isLoading()"
                  class="w-full py-2 rounded-xl text-xs font-semibold border border-border text-text-muted hover:text-text hover:bg-bg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Reenviar enlace
                </button>
              }
            </div>
          }

          <!-- Volver -->
          <div class="mt-6 pt-5 border-t border-border text-center">
            <a routerLink="/" class="text-xs text-text-muted hover:text-text transition-colors font-medium inline-flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isLoading = signal(false);
  error = signal<string | null>(null);
  emailSent = signal(false);
  countdown = signal(0);

  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  submit(): void {
    if (this.form.invalid) return;
    this.isLoading.set(true);
    this.error.set(null);

    const email = this.form.value.email!;
    this.userService.requestPasswordReset(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.emailSent.set(true);
        this.startCountdown(60);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Por seguridad el backend siempre responde 200,
        // pero si hay error de red, lo mostramos.
        const msg = err?.error?.detail || 'Error al conectar con el servidor. Intenta de nuevo.';
        if (err?.status === 0) {
          this.error.set('No se pudo conectar al servidor. Verifica tu conexión.');
        } else {
          // Igual consideramos éxito para no revelar si el email existe
          this.emailSent.set(true);
          this.startCountdown(60);
        }
      },
    });
  }

  resend(): void {
    this.emailSent.set(false);
    setTimeout(() => this.submit(), 100);
  }

  private startCountdown(seconds: number): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdown.set(seconds);
    this.countdownInterval = setInterval(() => {
      const current = this.countdown();
      if (current <= 1) {
        this.countdown.set(0);
        clearInterval(this.countdownInterval!);
        this.countdownInterval = null;
      } else {
        this.countdown.set(current - 1);
      }
    }, 1000);
  }
}
