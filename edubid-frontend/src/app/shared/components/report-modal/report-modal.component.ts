import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReportService, UserReportPayload } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SoundService } from '../../../core/services/sound.service';

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        (click)="onBackdropClick($event)"
      >
        <div
          class="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
          (click)="$event.stopPropagation()"
        >
          <!-- Cabecera del Modal -->
          <div class="px-5 py-4 border-b border-border bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm sm:text-base font-bold text-text leading-tight">Enviar Reporte a Soporte</h3>
                <p class="text-[11px] text-text-muted mt-0.5">Se enviará un reporte directo por correo al equipo técnico.</p>
              </div>
            </div>

            <button
              type="button"
              (click)="closeModal()"
              class="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Formulario -->
          <form (submit)="onSubmit($event)" class="p-5 space-y-4 text-xs sm:text-sm">
            <!-- Tipo de Reporte -->
            <div class="space-y-1">
              <label class="block font-semibold text-text text-xs uppercase tracking-wider">
                Tipo de asunto <span class="text-rose-500">*</span>
              </label>
              <select
                [(ngModel)]="tipo"
                name="tipo"
                required
                class="w-full px-3 py-2 rounded-xl bg-bg border border-border focus:border-primary focus:ring-1 focus:ring-primary text-text outline-hidden transition-all text-xs sm:text-sm"
              >
                <option value="bug">Error o fallo del sistema (Bug)</option>
                <option value="sugerencia">Sugerencia o mejora</option>
                <option value="educoins">Problema con EduCoins / Subastas</option>
                <option value="academico">Dificultad con actividades / notas</option>
                <option value="otro">Otro asunto</option>
              </select>
            </div>

            <!-- Asunto -->
            <div class="space-y-1">
              <label class="block font-semibold text-text text-xs uppercase tracking-wider">
                Título o Asunto breve <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="asunto"
                name="asunto"
                required
                maxlength="200"
                placeholder="Ej: No se actualiza el saldo de EduCoins tras la puja..."
                class="w-full px-3.5 py-2 rounded-xl bg-bg border border-border focus:border-primary focus:ring-1 focus:ring-primary text-text outline-hidden transition-all text-xs sm:text-sm"
              />
            </div>

            <!-- Descripción detallada -->
            <div class="space-y-1">
              <label class="block font-semibold text-text text-xs uppercase tracking-wider">
                Descripción detallada <span class="text-rose-500">*</span>
              </label>
              <textarea
                [(ngModel)]="descripcion"
                name="descripcion"
                required
                rows="4"
                placeholder="Describe qué ocurrió, los pasos para reproducirlo o tu sugerencia..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-border focus:border-primary focus:ring-1 focus:ring-primary text-text outline-hidden transition-all resize-none text-xs sm:text-sm"
              ></textarea>
            </div>

            <!-- Información técnica adjunta automáticamente -->
            <div class="p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-900/60 border border-border text-[11px] text-text-muted space-y-1">
              <div class="flex items-center gap-1.5 font-semibold text-text">
                <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Datos técnicos adjuntados automáticamente:</span>
              </div>
              <p class="truncate">
                • <strong>Remitente:</strong> {{ userEmail() }} ({{ userRole() }})
              </p>
              <p class="truncate">
                • <strong>Ruta actual:</strong> {{ currentRoute() }}
              </p>
            </div>

            <!-- Acciones -->
            <div class="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
              <!-- Enlace alternativo mailto -->
              <a
                [href]="getMailtoLink()"
                target="_blank"
                class="text-xs text-text-muted hover:text-primary transition-colors underline cursor-pointer py-1"
                title="Abrir en tu gestor de correo predeterminado"
              >
                Abrir en mi app de correo
              </a>

              <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  (click)="closeModal()"
                  class="px-4 py-2 rounded-xl border border-border bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-text transition-colors cursor-pointer w-full sm:w-auto"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  [disabled]="isSubmitting() || !isFormValid()"
                  class="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-primary text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                >
                  @if (isSubmitting()) {
                    <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    <span>Enviando...</span>
                  } @else {
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Enviar Reporte</span>
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class ReportModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private toastr = inject(NotificationService);
  private soundService = inject(SoundService, { optional: true });
  private router = inject(Router);

  tipo = 'bug';
  asunto = '';
  descripcion = '';
  isSubmitting = signal(false);

  userEmail = signal('usuario@edubid.co');
  userRole = signal('estudiante');
  currentRoute = signal('/');

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.userEmail.set(user.email);
      this.userRole.set(user.role);
    }
    this.currentRoute.set(this.router.url || window.location.pathname);
  }

  isFormValid(): boolean {
    return this.asunto.trim().length >= 3 && this.descripcion.trim().length >= 5;
  }

  onBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  onSubmit(e: Event): void {
    e.preventDefault();
    if (!this.isFormValid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const user = this.authService.currentUser();
    const payload: UserReportPayload = {
      tipo: this.tipo,
      asunto: this.asunto.trim(),
      descripcion: this.descripcion.trim(),
      email_contacto: user?.email,
      nombre_contacto: user ? `${user.first_name} ${user.last_name}`.trim() : undefined,
      pagina_origen: window.location.href,
      navegador_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconocido',
    };

    this.reportService.sendReport(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.soundService?.playSuccess?.();
        this.toastr.success(
          res.message || 'Reporte enviado con éxito a soporte.',
          'Reporte Recibido'
        );
        this.asunto = '';
        this.descripcion = '';
        this.closeModal();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.soundService?.playAlert?.();
        this.toastr.error(
          'No se pudo enviar el reporte por la API. Puedes usar el botón de abrir en app de correo.',
          'Error al enviar'
        );
      },
    });
  }

  getMailtoLink(): string {
    const recipient = 'ivanjmm01@gmail.com';
    const sub = encodeURIComponent(`[EduBid Reporte] [${this.tipo}] ${this.asunto || 'Sin asunto'}`);
    const body = encodeURIComponent(
      `Usuario: ${this.userEmail()} (${this.userRole()})\nPágina: ${this.currentRoute()}\n\nDescripción:\n${this.descripcion}`
    );
    return `mailto:${recipient}?subject=${sub}&body=${body}`;
  }
}
