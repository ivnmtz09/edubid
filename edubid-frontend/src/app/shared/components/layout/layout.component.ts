import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="flex min-h-screen">
      <aside class="w-64 bg-surface border-r border-border p-4">
        <h2 class="text-lg font-bold text-primary mb-6">EduBid</h2>
        <nav class="space-y-2">
          <a routerLink="/dashboard" class="block px-3 py-2 rounded hover:bg-bg">Dashboard</a>
          <a routerLink="/classrooms" class="block px-3 py-2 rounded hover:bg-bg">Aulas</a>
        </nav>
      </aside>
      <main class="flex-1 p-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class LayoutComponent {}
