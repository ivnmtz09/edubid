import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-8">
      <div class="w-full max-w-md text-center">
        <h1 class="text-2xl font-bold mb-4">Recuperar contraseña</h1>
        <p class="text-muted">Ingrese su correo electrónico para restablecer su contraseña.</p>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {}
