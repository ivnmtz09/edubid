import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-classrooms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="text-2xl font-bold">Aulas</h1>
      <p class="text-muted mt-2">Gestión de aulas</p>
    </div>
  `,
})
export class ClassroomsComponent {}
