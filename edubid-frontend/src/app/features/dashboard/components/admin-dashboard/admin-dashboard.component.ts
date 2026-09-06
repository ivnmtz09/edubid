import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService, DashboardStats } from '../../../../core/services/dashboard.service';
import { UserService } from '../../../../core/services/user.service';
import { InstitutionService } from '../../../../core/services/institution.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private userService = inject(UserService);
  private institutionService = inject(InstitutionService);
  private notificationService = inject(NotificationService);

  stats = signal<DashboardStats | null>(null);
  totalInstitutions = signal<number>(0);
  users = signal<User[]>([]);
  isLoading = signal<boolean>(true);
  
  // Filtros de tabla
  searchTerm = signal<string>('');
  selectedRole = signal<string>('todos');

  filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const role = this.selectedRole();
    let list = this.users();

    if (role !== 'todos') {
      list = list.filter((u) => u.role === role);
    }

    if (term) {
      list = list.filter((u) => {
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        return fullName.includes(term) || email.includes(term);
      });
    }

    return list;
  });

  totalStudentsCount = computed(() => {
    return this.users().filter(u => u.role === 'estudiante').length;
  });

  totalTeachersCount = computed(() => {
    return this.users().filter(u => u.role === 'docente').length;
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading.set(true);

    // 1. Cargar estadísticas generales
    this.dashboardService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats.set(res);
      },
      error: () => {
        // En caso de que no haya métricas iniciales
      }
    });

    // 2. Cargar instituciones
    this.institutionService.getInstitutions().subscribe({
      next: (institutions) => {
        this.totalInstitutions.set(institutions.length);
      },
      error: () => {}
    });

    // 3. Cargar usuarios reales
    this.userService.getUsersList().subscribe({
      next: (userList) => {
        this.users.set(userList);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notificationService.error('No se pudo cargar la lista de usuarios', 'Error');
      }
    });
  }

  getUserInitials(user: User): string {
    const f = user.first_name?.[0] || '';
    const l = user.last_name?.[0] || '';
    const initials = (f + l).toUpperCase();
    return initials || user.email?.slice(0, 2).toUpperCase() || 'U';
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'rector':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'coordinador':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      case 'docente':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'estudiante':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }
}
