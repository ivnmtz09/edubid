import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { SoundService } from './sound.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toastr = inject(ToastrService);
  private soundService = inject(SoundService);

  success(message: string, title: string = 'Éxito'): void {
    this.soundService.playSuccess();
    this.toastr.success(message, title);
  }

  error(message: string, title: string = 'Error'): void {
    this.soundService.playAlert();
    this.toastr.error(message, title);
  }

  info(message: string, title: string = 'Información'): void {
    this.soundService.playNotification();
    this.toastr.info(message, title);
  }

  warning(message: string, title: string = 'Advertencia'): void {
    this.soundService.playAlert();
    this.toastr.warning(message, title);
  }
}
