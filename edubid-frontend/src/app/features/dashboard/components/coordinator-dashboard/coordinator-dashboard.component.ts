import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService, DashboardStats } from '../../../../core/services/dashboard.service';
import { QrInvitationCardComponent } from '../../../../shared/components/ui/qr-card/qr-invitation-card.component';

@Component({
  selector: 'app-coordinator-dashboard',
  standalone: true,
  imports: [CommonModule, QrInvitationCardComponent],
  templateUrl: './coordinator-dashboard.component.html'
})
export class CoordinatorDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  stats = signal<DashboardStats | null>(null);
  isLoading = signal<boolean>(true);

  institutionName = computed(() => {
    return this.authService.currentUser()?.profile?.institucion?.nombre || 'Mi Institución';
  });

  institutionSlug = computed(() => {
    return this.authService.currentUser()?.profile?.institucion?.slug || '';
  });

  primaryColor = computed(() => {
    return (this.authService.currentUser()?.profile?.institucion as any)?.color_primario || '#0891b2';
  });

  ngOnInit(): void {
    this.dashboardService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
