import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { StudentDashboardComponent } from './student-dashboard/student-dashboard.component';
import { TeacherDashboardComponent } from './teacher-dashboard/teacher-dashboard.component';
import { RectorDashboardComponent } from './rector-dashboard/rector-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StudentDashboardComponent,
    TeacherDashboardComponent,
    RectorDashboardComponent,
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
          <app-rector-dashboard />
        }
        @case ('admin') {
          <app-rector-dashboard />
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
