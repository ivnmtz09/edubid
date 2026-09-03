import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <p class="text-muted mt-2">Bienvenido a EduBid</p>
    </div>
  `,
})
export class DashboardComponent {}
