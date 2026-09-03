import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-2xl font-bold mb-4">Verificando correo...</h1>
        <p class="text-muted">Espere un momento mientras verificamos su dirección de correo electrónico.</p>
      </div>
    </div>
  `,
})
export class VerifyEmailComponent {}
