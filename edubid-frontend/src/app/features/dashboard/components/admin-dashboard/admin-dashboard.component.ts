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

export interface Color {
  hex: string;
  nombre: string;
}

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
  editSelectedFile: File | null = null;
  editLogoPreview = signal<string | null>(null);
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
  newSelectedFile: File | null = null;
  newLogoPreview = signal<string | null>(null);

  // Modal de confirmación de eliminación de institución
  showDeleteConfirmModal = signal<boolean>(false);
  isDeleting = signal<boolean>(false);

  // Modal y estado para edición de usuario (Rol, Institución, Estado)
  showEditUserModal = signal<boolean>(false);
  isSavingUser = signal<boolean>(false);
  editingUser = signal<User | null>(null);
  editUserRole = signal<string>('estudiante');
  editUserInstitutionId = signal<number | null>(null);
  editUserIsActive = signal<boolean>(true);
  editUserFirstName = signal<string>('');
  editUserLastName = signal<string>('');

  // Paleta de 24 colores armónicos con nombres amigables (idéntica a la vista de rector)
  coloresDisponibles: Color[] = [
    // Naranjados y Rojos
    { hex: '#ea580c', nombre: 'Naranja EduBid' },
    { hex: '#dc2626', nombre: 'Rojo Fuego' },
    { hex: '#ef4444', nombre: 'Rojo Coral' },
    { hex: '#f97316', nombre: 'Naranja Vivo' },
    // Amarillos y Tierra
    { hex: '#d97706', nombre: 'Ámbar Dorado' },
    { hex: '#f59e0b', nombre: 'Amarillo Sol' },
    { hex: '#92400e', nombre: 'Café Oscuro' },
    { hex: '#78350f', nombre: 'Marrón Tierra' },
    // Verdes
    { hex: '#16a34a', nombre: 'Verde Naturaleza' },
    { hex: '#059669', nombre: 'Esmeralda' },
    { hex: '#0d9488', nombre: 'Verde Azulado' },
    { hex: '#10b981', nombre: 'Menta' },
    // Azules y Cianes
    { hex: '#2563eb', nombre: 'Azul Royal' },
    { hex: '#3b82f6', nombre: 'Azul Clásico' },
    { hex: '#0891b2', nombre: 'Cian Océano' },
    { hex: '#06b6d4', nombre: 'Celeste' },
    // Morados y Rosas
    { hex: '#7c3aed', nombre: 'Violeta Prestigio' },
    { hex: '#9333ea', nombre: 'Púrpura' },
    { hex: '#a855f7', nombre: 'Lavanda' },
    { hex: '#ec4899', nombre: 'Rosa Fucsia' },
    // Oscuros y Especiales
    { hex: '#374151', nombre: 'Gris Pizarra' },
    { hex: '#1f2937', nombre: 'Grafito' },
    { hex: '#065f46', nombre: 'Bosque Profundo' },
    { hex: '#7f1d1d', nombre: 'Burdeos' },
  ];

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
    this.editSelectedFile = null;
    this.editLogoPreview.set(null);
  }

  // --- Helpers de color y paletas ---
  getNombreColor(hex: string): string {
    if (!hex) return 'Personalizado';
    return this.coloresDisponibles.find(c => c.hex.toLowerCase() === hex.toLowerCase())?.nombre || 'Personalizado';
  }

  isLightColor(hex: string): boolean {
    if (!hex) return false;
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return false;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 160;
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

  isNewCurrentPalette(palette: BrandingPalette): boolean {
    return this.newColorPrimario() === palette.primary && this.newColorSecundario() === palette.secondary;
  }

  seleccionarEditPrimario(hex: string): void {
    this.editColorPrimario.set(hex);
  }

  seleccionarEditSecundario(hex: string): void {
    this.editColorSecundario.set(hex);
  }

  seleccionarNewPrimario(hex: string): void {
    this.newColorPrimario.set(hex);
  }

  seleccionarNewSecundario(hex: string): void {
    this.newColorSecundario.set(hex);
  }

  // --- Gestión de archivos de logo (Edición y Creación) ---
  onEditLogoSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      this.notificationService.error('Formato no válido. Selecciona un archivo JPG, JPEG o PNG.', 'Archivo');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.notificationService.error('El archivo excede el tamaño máximo de 2MB.', 'Archivo');
      return;
    }

    this.editSelectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.editLogoPreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeEditLogo(): void {
    this.editSelectedFile = null;
    this.editLogoPreview.set(null);
    this.editLogo.set('');
  }

  onNewLogoSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      this.notificationService.error('Formato no válido. Selecciona un archivo JPG, JPEG o PNG.', 'Archivo');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.notificationService.error('El archivo excede el tamaño máximo de 2MB.', 'Archivo');
      return;
    }

    this.newSelectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.newLogoPreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeNewLogo(): void {
    this.newSelectedFile = null;
    this.newLogoPreview.set(null);
    this.newLogo.set('');
  }

  onInstLogoError(event: Event, inst: Institution): void {
    const img = event.target as HTMLElement;
    if (img) {
      img.style.display = 'none';
      const parent = img.parentElement;
      if (parent && !parent.querySelector('.inst-err-fallback')) {
        const div = document.createElement('div');
        div.className = img.classList.contains('w-14')
          ? 'w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-xl text-white shrink-0 shadow-xs inst-err-fallback'
          : 'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs inst-err-fallback';
        div.style.backgroundColor = inst.color_primario || '#ea580c';
        div.innerText = (inst.nombre || 'ED').slice(0, 2).toUpperCase();
        parent.insertBefore(div, img);
      }
    }
  }

  saveInstitutionChanges(): void {
    const inst = this.selectedInstitution();
    if (!inst) return;

    if (!this.editNombre().trim()) {
      this.notificationService.error('El nombre de la institución no puede estar vacío.', 'Validación');
      return;
    }

    this.isSaving.set(true);

    const formData = new FormData();
    formData.append('nombre', this.editNombre().trim());
    if (this.editCodigoDane().trim()) {
      formData.append('codigo_dane', this.editCodigoDane().trim());
    }
    formData.append('activo', String(this.editActivo()));
    formData.append('color_primario', this.editColorPrimario());
    formData.append('color_secundario', this.editColorSecundario());

    if (this.editSelectedFile) {
      formData.append('logo', this.editSelectedFile);
    } else if (!this.editLogoPreview() && !this.editLogo()) {
      formData.append('logo', '');
    }

    this.institutionService.updateInstitution(inst.id, formData).subscribe({
      next: (updated) => {
        this.isSaving.set(false);
        this.editSelectedFile = null;
        this.notificationService.success(`Institución "${updated.nombre}" actualizada con éxito.`);
        
        // Actualizar la lista local reactivamente
        this.institutions.update(list => list.map(i => i.id === updated.id ? { ...i, ...updated } : i));
        this.populateEditForm(updated);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error(err);
        const detail = err.error?.detail || err.error?.codigo_dane?.[0] || 'Error al guardar los cambios de la institución.';
        this.notificationService.error(detail, 'Error');
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
    this.newSelectedFile = null;
    this.newLogoPreview.set(null);
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.newSelectedFile = null;
    this.newLogoPreview.set(null);
  }

  submitCreateInstitution(): void {
    if (!this.newNombre().trim()) {
      this.notificationService.error('Debes indicar el nombre de la institución.', 'Validación');
      return;
    }

    this.isCreating.set(true);

    const formData = new FormData();
    formData.append('nombre', this.newNombre().trim());
    if (this.newCodigoDane().trim()) {
      formData.append('codigo_dane', this.newCodigoDane().trim());
    }
    formData.append('activo', String(this.newActivo()));
    formData.append('color_primario', this.newColorPrimario());
    formData.append('color_secundario', this.newColorSecundario());

    if (this.newSelectedFile) {
      formData.append('logo', this.newSelectedFile);
    } else if (this.newLogo().trim()) {
      formData.append('logo', this.newLogo().trim());
    }

    this.institutionService.createInstitution(formData).subscribe({
      next: (created) => {
        this.isCreating.set(false);
        this.newSelectedFile = null;
        this.newLogoPreview.set(null);
        this.showCreateModal.set(false);
        this.notificationService.success(`Institución "${created.nombre}" creada con éxito.`);
        
        // Agregar a la lista y seleccionarla inmediatamente para continuar su gestión
        this.institutions.update(list => [...list, created]);
        this.onSelectInstitution(created.id.toString());
      },
      error: (err) => {
        this.isCreating.set(false);
        console.error(err);
        const detail = err.error?.detail || err.error?.codigo_dane?.[0] || 'Error al registrar la institución en el sistema.';
        this.notificationService.error(detail, 'Error');
      }
    });
  }

  // ================= GESTIÓN DE ROLES Y USUARIOS =================

  openEditUserModal(user: User): void {
    this.editingUser.set(user);
    this.editUserRole.set(user.role);
    this.editUserInstitutionId.set(user.profile?.institucion?.id ?? null);
    this.editUserIsActive.set(user.is_active !== false);
    this.editUserFirstName.set(user.first_name || '');
    this.editUserLastName.set(user.last_name || '');
    this.showEditUserModal.set(true);
  }

  closeEditUserModal(): void {
    this.showEditUserModal.set(false);
    this.editingUser.set(null);
  }

  onRoleChange(newRole: string): void {
    this.editUserRole.set(newRole);
    if (newRole === 'admin') {
      this.editUserInstitutionId.set(null);
    }
  }

  onInstitutionChange(val: any): void {
    if (!val || val === 'null' || val === 'undefined') {
      this.editUserInstitutionId.set(null);
    } else {
      this.editUserInstitutionId.set(Number(val));
    }
  }

  saveUserChanges(): void {
    const user = this.editingUser();
    if (!user) return;

    this.isSavingUser.set(true);

    const payload: any = {
      first_name: this.editUserFirstName().trim(),
      last_name: this.editUserLastName().trim(),
      role: this.editUserRole(),
      is_active: this.editUserIsActive(),
      institucion_id: this.editUserRole() === 'admin' ? null : this.editUserInstitutionId()
    };

    this.userService.updateUser(user.id, payload).subscribe({
      next: (res) => {
        this.isSavingUser.set(false);
        this.showEditUserModal.set(false);
        this.notificationService.success(`Usuario ${user.email} actualizado exitosamente.`);

        const updatedUser = res?.user || res;
        this.users.update(list => list.map(u => {
          if (u.id === user.id) {
            const inst = this.institutions().find(i => i.id === this.editUserInstitutionId());
            return {
              ...u,
              ...updatedUser,
              first_name: this.editUserFirstName().trim(),
              last_name: this.editUserLastName().trim(),
              role: this.editUserRole() as any,
              is_active: this.editUserIsActive(),
              profile: {
                ...u.profile,
                institucion: this.editUserRole() === 'admin' ? null : (inst ? {
                  id: inst.id,
                  nombre: inst.nombre,
                  color_primario: inst.color_primario,
                  color_secundario: inst.color_secundario,
                  logo: inst.logo ?? null,
                  codigo_dane: inst.codigo_dane
                } : null)
              }
            };
          }
          return u;
        }));
      },
      error: (err) => {
        this.isSavingUser.set(false);
        console.error(err);
        const detail = err.error?.detail || err.error?.institucion?.[0] || 'Error al actualizar el usuario.';
        this.notificationService.error(detail, 'Error');
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
