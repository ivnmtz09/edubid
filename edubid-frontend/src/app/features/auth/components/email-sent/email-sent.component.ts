import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-email-sent',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center p-8">
      <div class="w-full max-w-md text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 mb-6">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold mb-3">¡Revisa tu correo!</h1>
        <p class="text-muted mb-6">
          Te enviamos un enlace de verificación. Por favor revisa tu bandeja de entrada
          (y carpeta de spam) para activar tu cuenta.
        </p>
        <a
          routerLink="/"
          class="inline-block bg-primary hover:bg-primary-hover text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  `,
})
export class EmailSentComponent {}
