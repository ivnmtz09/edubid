import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QrInvitationCardComponent } from './qr-invitation-card.component';

@Component({
  selector: 'app-qr-invitation-modal',
  standalone: true,
  imports: [CommonModule, QrInvitationCardComponent],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div class="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
          
          <!-- Encabezado del Modal con botón de cierre -->
          <div class="flex items-center justify-between pb-3 border-b border-border">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div>
                <h3 class="font-extrabold text-neutral-900 dark:text-neutral-100 text-base">
                  {{ modalTitle() }}
                </h3>
                <p class="text-xs text-text-muted">
                  {{ institutionName() }}
                </p>
              </div>
            </div>

            <button
              type="button"
              (click)="close.emit()"
              class="p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Componente de Tarjeta QR -->
          <app-qr-invitation-card
            [role]="role()"
            [roleLabel]="roleLabel()"
            [title]="cardTitle()"
            [description]="cardDescription()"
            [institutionName]="institutionName()"
            [institutionSlug]="institutionSlug()"
            [routePath]="routePath()"
            [primaryColor]="primaryColor()"
          />

          <!-- Botón de Cerrar / Continuar -->
          <div class="pt-2 flex justify-end">
            <button
              type="button"
              (click)="close.emit()"
              class="px-5 py-2.5 rounded-xl font-bold text-xs bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white shadow-xs transition-colors cursor-pointer"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class QrInvitationModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly modalTitle = input<string>('Enlace de Registro & Código QR');
  readonly institutionName = input.required<string>();
  readonly institutionSlug = input.required<string>();
  readonly role = input<'rector' | 'coordinador' | 'docente' | 'estudiante'>('rector');
  readonly roleLabel = input<string>('Rector');
  readonly cardTitle = input<string>('Invitación Exclusiva');
  readonly cardDescription = input<string>('Permite vincular automáticamente al usuario a esta institución.');
  readonly routePath = input<string>('registro-rector');
  readonly primaryColor = input<string>('#ea580c');

  readonly close = output<void>();
}
