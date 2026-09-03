import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-classroom-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="text-2xl font-bold">Detalle de Aula</h1>
      <p class="text-muted mt-2">Vista detallada del aula</p>
    </div>
  `,
})
export class ClassroomDetailComponent {}
