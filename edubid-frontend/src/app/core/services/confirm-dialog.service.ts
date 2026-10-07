import { Injectable, signal, inject } from '@angular/core';
import { SoundService } from './sound.service';

export type ConfirmType = 'danger' | 'warning' | 'primary' | 'info';

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  icon?: 'warning' | 'trash' | 'auction' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  private soundService = inject(SoundService);
  private dialogState = signal<ConfirmDialogOptions | null>(null);
  private resolver: ((value: boolean) => void) | null = null;

  readonly state = this.dialogState.asReadonly();

  confirm(options: ConfirmDialogOptions | string): Promise<boolean> {
    const opts: ConfirmDialogOptions =
      typeof options === 'string' ? { message: options } : options;

    const dialogData: ConfirmDialogOptions = {
      title: opts.title || 'Confirmación Requerida',
      message: opts.message,
      confirmText: opts.confirmText || 'Confirmar',
      cancelText: opts.cancelText || 'Cancelar',
      type: opts.type || 'warning',
      icon: opts.icon || (opts.type === 'danger' ? 'trash' : 'warning'),
    };

    if (dialogData.type === 'danger') {
      this.soundService.playAlert();
    } else {
      this.soundService.playNotification();
    }

    this.dialogState.set(dialogData);

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  handleConfirm(): void {
    if (this.resolver) {
      this.resolver(true);
      this.resolver = null;
    }
    this.dialogState.set(null);
  }

  handleCancel(): void {
    if (this.resolver) {
      this.resolver(false);
      this.resolver = null;
    }
    this.dialogState.set(null);
  }
}
