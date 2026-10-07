import {
  Component,
  inject,
  computed,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (dialog(); as d) {
      <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        (click)="onBackdropClick($event)"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto text-text"
          (click)="$event.stopPropagation()"
        >
          <!-- Contenido del Diálogo -->
          <div class="p-6 text-center space-y-4">
            <!-- Icono Decorativo Dinámico -->
            <div
              class="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-inner transition-transform duration-200"
              [ngClass]="{
                'bg-rose-500/10 text-rose-500 border border-rose-500/20': d.type === 'danger',
                'bg-amber-500/10 text-amber-500 border border-amber-500/20': d.type === 'warning',
                'bg-primary/10 text-primary border border-primary/20': d.type === 'primary' || d.type === 'info'
              }"
            >
              @if (d.icon === 'trash') {
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              } @else if (d.icon === 'auction') {
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              } @else {
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            </div>

            <!-- Título y Descripción -->
            <div>
              <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {{ d.title }}
              </h3>
              <p class="text-xs sm:text-sm text-text-muted mt-2 leading-relaxed">
                {{ d.message }}
              </p>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="px-6 py-4 bg-surface/50 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              (click)="onCancel()"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-black/5 dark:hover:bg-white/5 text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              {{ d.cancelText }}
            </button>
            <button
              type="button"
              (click)="onConfirm()"
              class="px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              [ngClass]="{
                'bg-rose-600 hover:bg-rose-700': d.type === 'danger',
                'bg-amber-600 hover:bg-amber-700': d.type === 'warning',
                'bg-primary hover:bg-primary-hover': d.type === 'primary' || d.type === 'info'
              }"
            >
              {{ d.confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmModalComponent {
  readonly confirmService = inject(ConfirmDialogService);
  readonly dialog = computed(() => this.confirmService.state());

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialog()) {
      this.confirmService.handleCancel();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.confirmService.handleCancel();
    }
  }

  onConfirm(): void {
    this.confirmService.handleConfirm();
  }

  onCancel(): void {
    this.confirmService.handleCancel();
  }
}
