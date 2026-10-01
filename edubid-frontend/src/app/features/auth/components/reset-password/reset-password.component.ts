import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('new_password')?.value;
  const confirm = control.get('confirm_password')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
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
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style="background: var(--brand-primary);">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-neutral-100">Nueva Contraseña</h1>
          <p class="text-sm text-text-muted mt-1">Define tu nueva contraseña segura para ingresar a EduBid.</p>
        </div>

        <!-- Tarjeta Principal -->
        <div class="bento-card p-8">

          @if (tokenInvalid()) {
            <!-- Token inválido -->
            <div class="text-center space-y-4">
              <div class="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 mx-auto">
                <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.07 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 dark:text-neutral-100">Enlace inválido o expirado</h3>
                <p class="text-xs text-text-muted mt-1 leading-relaxed">
                  Este enlace de restablecimiento ya fue usado o ha expirado. Solicita uno nuevo.
                </p>
              </div>
              <a routerLink="/forgot-password" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all" style="background: var(--brand-primary);">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Solicitar nuevo enlace
              </a>
            </div>

          } @else if (!resetSuccess()) {
            <!-- Formulario de Nueva Contraseña -->
            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">

              @if (error()) {
                <div class="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs">
                  <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {{ error() }}
                </div>
              }

              <!-- Nueva Contraseña -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-text-muted uppercase tracking-wide">Nueva Contraseña</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  </span>
                  <input
                    [type]="showNew() ? 'text' : 'password'"
                    formControlName="new_password"
                    placeholder="Mínimo 8 caracteres"
                    class="w-full pl-10 pr-10 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    [class.border-red-400]="form.get('new_password')?.invalid && form.get('new_password')?.touched"
                  />
                  <button type="button" (click)="showNew.update(v => !v)" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer transition-colors">
                    @if (showNew()) {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    } @else {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    }
                  </button>
                </div>
                @if (form.get('new_password')?.hasError('required') && form.get('new_password')?.touched) {
                  <p class="text-[11px] text-red-500 font-medium">La contraseña es requerida.</p>
                }
                @if (form.get('new_password')?.hasError('minlength') && form.get('new_password')?.touched) {
                  <p class="text-[11px] text-red-500 font-medium">La contraseña debe tener mínimo 8 caracteres.</p>
                }
              </div>

              <!-- Confirmar Contraseña -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-text-muted uppercase tracking-wide">Confirmar Contraseña</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </span>
                  <input
                    [type]="showConfirm() ? 'text' : 'password'"
                    formControlName="confirm_password"
                    placeholder="Repite tu contraseña"
                    class="w-full pl-10 pr-10 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    [class.border-red-400]="(form.hasError('mismatch') || form.get('confirm_password')?.invalid) && form.get('confirm_password')?.touched"
                  />
                  <button type="button" (click)="showConfirm.update(v => !v)" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer transition-colors">
                    @if (showConfirm()) {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    } @else {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    }
                  </button>
                </div>
                @if (form.hasError('mismatch') && form.get('confirm_password')?.touched) {
                  <p class="text-[11px] text-red-500 font-medium">Las contraseñas no coinciden.</p>
                }
              </div>

              <!-- Indicador de coincidencia -->
              @if (form.get('new_password')?.value && form.get('confirm_password')?.value) {
                <div class="flex items-center gap-2 text-xs">
                  @if (!form.hasError('mismatch')) {
                    <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span class="text-emerald-500 font-medium">Las contraseñas coinciden</span>
                  } @else {
                    <svg class="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    <span class="text-red-500 font-medium">No coinciden</span>
                  }
                </div>
              }

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
                  <span>Guardando...</span>
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <span>Restablecer Contraseña</span>
                }
              </button>
            </form>

          } @else {
            <!-- Éxito -->
            <div class="text-center space-y-4">
              <div class="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mx-auto">
                <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 dark:text-neutral-100 text-base">¡Contraseña actualizada!</h3>
                <p class="text-xs text-text-muted mt-1 leading-relaxed">
                  Tu contraseña fue restablecida exitosamente. Ya puedes iniciar sesión con tu nueva clave.
                </p>
              </div>
              <a routerLink="/" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all" style="background: var(--brand-primary);">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
                Ir al inicio de sesión
              </a>
            </div>
          }

          <!-- Volver -->
          @if (!resetSuccess() && !tokenInvalid()) {
            <div class="mt-6 pt-5 border-t border-border text-center">
              <a routerLink="/forgot-password" class="text-xs text-text-muted hover:text-text transition-colors font-medium inline-flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                Solicitar nuevo enlace
              </a>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);

  private uidb64 = '';
  private token = '';

  form = this.fb.group(
    {
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  isLoading = signal(false);
  error = signal<string | null>(null);
  tokenInvalid = signal(false);
  resetSuccess = signal(false);
  showNew = signal(false);
  showConfirm = signal(false);

  ngOnInit(): void {
    this.uidb64 = this.route.snapshot.paramMap.get('uidb64') || '';
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.uidb64 || !this.token) {
      this.tokenInvalid.set(true);
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.isLoading.set(true);
    this.error.set(null);

    const newPassword = this.form.value.new_password!;
    this.userService.confirmPasswordReset(this.uidb64, this.token, newPassword).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.resetSuccess.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        const detail = err?.error?.detail || '';
        if (err?.status === 400 && detail.toLowerCase().includes('inválido')) {
          this.tokenInvalid.set(true);
        } else {
          this.error.set(detail || 'Ocurrió un error. Por favor intenta de nuevo.');
        }
      },
    });
  }
}
