import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { StudentDashboardComponent } from './student-dashboard/student-dashboard.component';
import { TeacherDashboardComponent } from './teacher-dashboard/teacher-dashboard.component';
import { RectorDashboardComponent } from './rector-dashboard/rector-dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { CoordinatorDashboardComponent } from './coordinator-dashboard/coordinator-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StudentDashboardComponent,
    TeacherDashboardComponent,
    RectorDashboardComponent,
    AdminDashboardComponent,
    CoordinatorDashboardComponent,
  ],
  template: `
    <div class="w-full">
      @switch (userRole()) {
        @case ('estudiante') {
          <app-student-dashboard />
        }
        @case ('docente') {
          <app-teacher-dashboard />
        }
        @case ('rector') {
          <app-rector-dashboard />
        }
        @case ('coordinador') {
          <app-coordinator-dashboard />
        }
        @case ('admin') {
          <app-admin-dashboard />
        }
        @default {
          <app-student-dashboard />
        }
      }
    </div>
  `,
})
export class DashboardComponent {
  private authService = inject(AuthService);

  userRole = computed(() => {
    return this.authService.currentUser()?.role || 'estudiante';
  });
}
