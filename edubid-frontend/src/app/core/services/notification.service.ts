import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toastr = inject(ToastrService);

  success(message: string, title: string = 'Éxito'): void {
    this.toastr.success(message, title);
  }

  error(message: string, title: string = 'Error'): void {
    this.toastr.error(message, title);
  }

  info(message: string, title: string = 'Información'): void {
    this.toastr.info(message, title);
  }

  warning(message: string, title: string = 'Advertencia'): void {
    this.toastr.warning(message, title);
  }
}
