import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-coordinator-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coordinator-dashboard.component.html'
})
export class CoordinatorDashboardComponent {
  authService = inject(AuthService);
}
