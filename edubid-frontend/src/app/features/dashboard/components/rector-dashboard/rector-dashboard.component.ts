import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rector-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="text-2xl font-bold">Dashboard Rector</h1>
      <p class="text-muted mt-2">Vista del rector</p>
    </div>
  `,
})
export class RectorDashboardComponent {}
