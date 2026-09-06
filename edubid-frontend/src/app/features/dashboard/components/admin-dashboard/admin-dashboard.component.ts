import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService, DashboardStats } from '../../../../core/services/dashboard.service';
import { UserService } from '../../../../core/services/user.service';
import { InstitutionService, Institution, InstitutionCreateRequest, InstitutionUpdateRequest } from '../../../../core/services/institution.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { User } from '../../../../core/models/user.model';

export interface BrandingPalette {
  name: string;
  primary: string;
  secondary: string;
}

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
  private themeService = inject(ThemeService);

  // Estado global de datos
  stats = signal<DashboardStats | null>(null);
  institutions = signal<Institution[]>([]);
  users = signal<User[]>([]);
  isLoading = signal<boolean>(true);

  // Contexto de vista: 'all' (Vista General) o ID numérico en string ('1', '2', etc.)
  selectedInstitutionId = signal<string>('all');

  // Pestaña activa en Vista Individual: 'branding' | 'members'
  individualActiveTab = signal<'branding' | 'members'>('branding');

  // Filtros de búsqueda para la tabla global de usuarios
  searchTerm = signal<string>('');
  selectedRole = signal<string>('todos');

  // Buscador en el directorio de instituciones (Vista General)
  institutionSearchTerm = signal<string>('');

  // Buscador de miembros en Vista Individual
  memberSearchTerm = signal<string>('');
  selectedMemberRole = signal<string>('todos');

  // Formulario de edición de institución seleccionada
  editNombre = signal<string>('');
  editCodigoDane = signal<string>('');
  editActivo = signal<boolean>(true);
  editColorPrimario = signal<string>('#ea580c');
  editColorSecundario = signal<string>('#3b82f6');
  editLogo = signal<string>('');
  isSaving = signal<boolean>(false);

  // Modal y formulario de creación de nueva institución
  showCreateModal = signal<boolean>(false);
  isCreating = signal<boolean>(false);
  newNombre = signal<string>('');
  newCodigoDane = signal<string>('');
  newActivo = signal<boolean>(true);
  newColorPrimario = signal<string>('#ea580c');
  newColorSecundario = signal<string>('#3b82f6');
  newLogo = signal<string>('');

  // Modal de confirmación de eliminación
  showDeleteConfirmModal = signal<boolean>(false);
  isDeleting = signal<boolean>(false);

  // Paletas predefinidas para Branding
  palettes: BrandingPalette[] = [
    { name: 'EduBid Clásico', primary: '#ea580c', secondary: '#3b82f6' },
    { name: 'Océano', primary: '#0891b2', secondary: '#4f46e5' },
    { name: 'Naturaleza', primary: '#059669', secondary: '#d97706' },
    { name: 'Prestigio', primary: '#7c3aed', secondary: '#ec4899' },
    { name: 'Corporativo', primary: '#2563eb', secondary: '#059669' },
    { name: 'Carmesí', primary: '#dc2626', secondary: '#4f46e5' },
  ];

  // ================= COMPUTED PROPERTIES =================

  // Institución seleccionada actualmente (o null si está en 'all')
  selectedInstitution = computed<Institution | null>(() => {
    const id = this.selectedInstitutionId();
    if (id === 'all') return null;
    const numId = Number(id);
    return this.institutions().find(inst => inst.id === numId) || null;
  });

  // Lista filtrada de instituciones para el Directorio de la Vista General
  filteredInstitutions = computed<Institution[]>(() => {
    const term = this.institutionSearchTerm().trim().toLowerCase();
    let list = this.institutions();
    if (!term) return list;
    return list.filter(inst => 
      inst.nombre.toLowerCase().includes(term) || 
      (inst.codigo_dane && inst.codigo_dane.toLowerCase().includes(term))
    );
  });

  // Conteo de instituciones activas vs inactivas
  activeInstitutionsCount = computed(() => {
    return this.institutions().filter(i => i.activo).length;
  });

  inactiveInstitutionsCount = computed(() => {
    return this.institutions().filter(i => !i.activo).length;
  });

  // Usuarios pertenecientes a la institución seleccionada
  institutionUsers = computed<User[]>(() => {
    const inst = this.selectedInstitution();
    if (!inst) return [];
    return this.users().filter(u => u.profile?.institucion?.id === inst.id && u.role !== 'admin');
  });

  // Conteo de estudiantes y docentes en la institución seleccionada
  selectedInstStudentsCount = computed(() => {
    return this.institutionUsers().filter(u => u.role === 'estudiante').length;
  });

  selectedInstTeachersCount = computed(() => {
    return this.institutionUsers().filter(u => u.role === 'docente').length;
  });

  // Rector asignado a la institución seleccionada
  selectedInstRector = computed<User | null>(() => {
    return this.institutionUsers().find(u => u.role === 'rector') || null;
  });

  // Miembros filtrados en la Vista Individual
  filteredInstitutionMembers = computed<User[]>(() => {
    const term = this.memberSearchTerm().trim().toLowerCase();
    const role = this.selectedMemberRole();
    let list = this.institutionUsers();

    if (role !== 'todos') {
      list = list.filter(u => u.role === role);
    }

    if (term) {
      list = list.filter(u => {
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        return fullName.includes(term) || email.includes(term);
      });
    }

    return list;
  });

  // Usuarios filtrados para la tabla general
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

  // ================= LIFECYCLE =================

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
      error: () => {}
    });

    // 2. Cargar instituciones
    this.institutionService.getInstitutions().subscribe({
      next: (instList) => {
        this.institutions.set(instList);
        // Si hay una institución seleccionada, sincronizar su formulario
        if (this.selectedInstitutionId() !== 'all') {
          const current = instList.find(i => i.id === Number(this.selectedInstitutionId()));
          if (current) {
            this.populateEditForm(current);
          } else {
            this.selectedInstitutionId.set('all');
          }
        }
      },
      error: () => {
        this.notificationService.error('Error al cargar la lista de instituciones', 'Error');
      }
    });

    // 3. Cargar usuarios reales
    this.userService.getUsersList().subscribe({
      next: (userList) => {
        this.users.set(userList);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.error('No se pudo cargar la lista de usuarios', 'Error');
      }
    });
  }

  // ================= MÉTODOS DE GESTIÓN DE INSTITUCIONES =================

  onSelectInstitution(idOrAll: string): void {
    this.selectedInstitutionId.set(idOrAll);
    if (idOrAll === 'all') {
      return;
    }
    const inst = this.institutions().find(i => i.id === Number(idOrAll));
    if (inst) {
      this.populateEditForm(inst);
    }
  }

  selectInstitutionFromCard(inst: Institution): void {
    this.onSelectInstitution(inst.id.toString());
  }

  returnToGeneralView(): void {
    this.selectedInstitutionId.set('all');
  }

  private populateEditForm(inst: Institution): void {
    this.editNombre.set(inst.nombre || '');
    this.editCodigoDane.set(inst.codigo_dane || '');
    this.editActivo.set(inst.activo ?? true);
    this.editColorPrimario.set(inst.color_primario || '#ea580c');
    this.editColorSecundario.set(inst.color_secundario || '#3b82f6');
    this.editLogo.set(inst.logo || '');
  }

  applyPalette(palette: BrandingPalette): void {
    this.editColorPrimario.set(palette.primary);
    this.editColorSecundario.set(palette.secondary);
  }

  isCurrentPalette(palette: BrandingPalette): boolean {
    return this.editColorPrimario() === palette.primary && this.editColorSecundario() === palette.secondary;
  }

  applyPaletteToNew(palette: BrandingPalette): void {
    this.newColorPrimario.set(palette.primary);
    this.newColorSecundario.set(palette.secondary);
  }

  saveInstitutionChanges(): void {
    const inst = this.selectedInstitution();
    if (!inst) return;

    if (!this.editNombre().trim()) {
      this.notificationService.error('El nombre de la institución no puede estar vacío.', 'Validación');
      return;
    }

    this.isSaving.set(true);

    const payload: InstitutionUpdateRequest = {
      nombre: this.editNombre().trim(),
      codigo_dane: this.editCodigoDane().trim() || null,
      activo: this.editActivo(),
      color_primario: this.editColorPrimario(),
      color_secundario: this.editColorSecundario(),
      logo: this.editLogo().trim() || null
    };

    this.institutionService.updateInstitution(inst.id, payload).subscribe({
      next: (updated) => {
        this.isSaving.set(false);
        this.notificationService.success(`Institución "${updated.nombre}" actualizada con éxito.`);
        
        // Actualizar la lista local reactivamente
        this.institutions.update(list => list.map(i => i.id === updated.id ? { ...i, ...updated } : i));
        this.populateEditForm(updated);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error(err);
        this.notificationService.error('Error al guardar los cambios de la institución.', 'Error');
      }
    });
  }

  // ================= CREACIÓN DE INSTITUCIÓN =================

  openCreateModal(): void {
    this.newNombre.set('');
    this.newCodigoDane.set('');
    this.newActivo.set(true);
    this.newColorPrimario.set('#ea580c');
    this.newColorSecundario.set('#3b82f6');
    this.newLogo.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  submitCreateInstitution(): void {
    if (!this.newNombre().trim()) {
      this.notificationService.error('Debes indicar el nombre de la institución.', 'Validación');
      return;
    }

    this.isCreating.set(true);

    const payload: InstitutionCreateRequest = {
      nombre: this.newNombre().trim(),
      codigo_dane: this.newCodigoDane().trim() || null,
      activo: this.newActivo(),
      color_primario: this.newColorPrimario(),
      color_secundario: this.newColorSecundario(),
      logo: this.newLogo().trim() || null
    };

    this.institutionService.createInstitution(payload).subscribe({
      next: (created) => {
        this.isCreating.set(false);
        this.showCreateModal.set(false);
        this.notificationService.success(`Institución "${created.nombre}" creada con éxito.`);
        
        // Agregar a la lista y seleccionarla inmediatamente para continuar su gestión
        this.institutions.update(list => [...list, created]);
        this.onSelectInstitution(created.id.toString());
      },
      error: (err) => {
        this.isCreating.set(false);
        console.error(err);
        this.notificationService.error('Error al registrar la institución en el sistema.', 'Error');
      }
    });
  }

  // ================= ELIMINACIÓN DE INSTITUCIÓN =================

  openDeleteConfirmModal(): void {
    this.showDeleteConfirmModal.set(true);
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal.set(false);
  }

  deleteSelectedInstitution(): void {
    const inst = this.selectedInstitution();
    if (!inst) return;

    this.isDeleting.set(true);

    this.institutionService.deleteInstitution(inst.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.showDeleteConfirmModal.set(false);
        this.notificationService.success(`Institución "${inst.nombre}" eliminada correctamente.`);
        
        // Quitar de la lista y volver a la vista general
        this.institutions.update(list => list.filter(i => i.id !== inst.id));
        this.selectedInstitutionId.set('all');
      },
      error: (err) => {
        this.isDeleting.set(false);
        console.error(err);
        this.notificationService.error('No se pudo eliminar la institución.', 'Error');
      }
    });
  }

  // Helper para contar miembros de una institución dada
  getInstitutionMemberCounts(instId: number): { students: number; teachers: number; total: number } {
    const members = this.users().filter(u => u.profile?.institucion?.id === instId && u.role !== 'admin');
    const students = members.filter(u => u.role === 'estudiante').length;
    const teachers = members.filter(u => u.role === 'docente').length;
    return { students, teachers, total: members.length };
  }

  // ================= AUXILIARES UI =================

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
