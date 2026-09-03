import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-8">
      <div class="w-full max-w-md text-center">
        <h1 class="text-2xl font-bold mb-4">Completar perfil</h1>
        <p class="text-muted">Por favor complete su perfil para continuar.</p>
      </div>
    </div>
  `,
})
export class CompleteProfileComponent {}
