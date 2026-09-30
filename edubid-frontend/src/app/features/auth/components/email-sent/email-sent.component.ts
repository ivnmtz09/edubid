import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-email-sent',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <!-- Logo Header -->
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

        <div class="bg-surface py-8 px-6 shadow-sm border border-border sm:rounded-2xl sm:px-10 text-center space-y-6">
          <!-- Icono Buzón -->
          <div class="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div>
            <h1 class="text-2xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
              ¡Revisa tu correo!
            </h1>
            <p class="text-sm text-text-muted mt-2">
              Hemos enviado un enlace de confirmación para activar tu cuenta de EduBid.
            </p>
            @if (userEmail()) {
              <div class="mt-2.5 inline-block px-3 py-1 rounded-lg bg-bg border border-border text-xs font-mono font-medium text-text">
                {{ userEmail() }}
              </div>
            }
          </div>

          <!-- Caja informativa de Spam -->
          <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left space-y-2">
            <div class="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>¿No encuentras el correo?</span>
            </div>
            <ul class="text-xs text-text-muted space-y-1 list-disc list-inside">
              <li>Revisa tu carpeta de <strong>Spam</strong> o <strong>Correo no deseado</strong>.</li>
              <li>Asegúrate de haber escrito correctamente tu dirección de correo.</li>
              <li>El enlace tiene una validez de 24 horas.</li>
            </ul>
          </div>

          <!-- Sección de reenvío -->
          <div class="pt-2 border-t border-border space-y-3">
            <div class="flex flex-col gap-2">
              @if (!userEmail()) {
                <input
                  type="email"
                  [(ngModel)]="manualEmail"
                  placeholder="tu-correo@ejemplo.com"
                  class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-xs text-text focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                />
              }

              <button
                type="button"
                (click)="onResend()"
                [disabled]="isResending() || cooldown() > 0 || (!userEmail() && !manualEmail.trim())"
                class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-text bg-bg hover:bg-black/5 dark:hover:bg-white/5 border border-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (isResending()) {
                  <span>Enviando enlace...</span>
                } @else if (cooldown() > 0) {
                  <span>Reenviar en {{ cooldown() }}s</span>
                } @else {
                  <span>Reenviar correo de verificación</span>
                }
              </button>
            </div>

            @if (feedbackMessage()) {
              <p
                class="text-xs"
                [class.text-emerald-600]="isSuccess()"
                [class.dark:text-emerald-400]="isSuccess()"
                [class.text-red-600]="!isSuccess()"
                [class.dark:text-red-400]="!isSuccess()"
              >
                {{ feedbackMessage() }}
              </p>
            }
          </div>

          <!-- Acciones de navegación -->
          <div class="pt-2 flex flex-col sm:flex-row gap-2">
            <a
              routerLink="/login"
              class="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs text-center transition-colors cursor-pointer"
            >
              Ir a Iniciar Sesión
            </a>
            <a
              routerLink="/"
              class="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-text-muted hover:text-text text-center transition-colors cursor-pointer"
            >
              Volver al Inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class EmailSentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  userEmail = signal<string | null>(null);
  manualEmail = '';
  isResending = signal(false);
  isSuccess = signal(false);
  feedbackMessage = signal<string | null>(null);
  cooldown = signal(0);
  private timer: any = null;

  ngOnInit(): void {
    // Intentar leer de router state o query params
    const stateEmail = history.state?.email;
    const queryEmail = this.route.snapshot.queryParamMap.get('email');
    const email = stateEmail || queryEmail || null;
    if (email) {
      this.userEmail.set(email);
      this.manualEmail = email;
    }
  }

  onResend(): void {
    const email = (this.userEmail() || this.manualEmail).trim();
    if (!email) return;

    this.isResending.set(true);
    this.feedbackMessage.set(null);

    this.authService.resendVerification(email).subscribe({
      next: (res) => {
        this.isResending.set(false);
        this.isSuccess.set(true);
        this.feedbackMessage.set(res.message || 'Se ha reenviado el enlace. Revisa tu bandeja de entrada o spam.');
        this.startCooldown();
      },
      error: (err) => {
        this.isResending.set(false);
        this.isSuccess.set(false);
        this.feedbackMessage.set(err.error?.detail || err.error?.message || 'Error al solicitar el reenvío. Verifica el correo.');
      },
    });
  }

  private startCooldown(seconds = 60): void {
    this.cooldown.set(seconds);
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.cooldown.update((c) => {
        if (c <= 1) {
          clearInterval(this.timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }
}
