import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-8 bg-bg text-text">
      <div class="w-full max-w-md text-center">
        <h1 class="text-2xl font-bold mb-4">Completar perfil</h1>
        <p class="text-text-muted">Por favor complete su perfil para continuar.</p>
      </div>
    </div>
  `,
})
export class CompleteProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    if (this.authService.currentUser()?.role === 'admin') {
      this.router.navigate(['/dashboard']);
    }
  }
}
