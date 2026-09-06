import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ClassroomService, Classroom } from '../../../core/services/classroom.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-classrooms',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      <!-- Encabezado de la página -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface border border-border text-text-muted mb-2">
            <span>{{ isDocente() ? 'Gestión Pedagógica' : 'Supervisión Académica' }}</span>
            <span>•</span>
            <span class="font-mono text-slate-900 dark:text-white">Clases</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {{ isDocente() ? 'Mis Clases' : 'Supervisión de Clases' }}
          </h1>
          <p class="text-sm text-text-muted mt-1">
            {{ isDocente() 
              ? 'Administra tus asignaturas académicas y gestiona los grupos y códigos de vinculación de cada una.' 
              : 'Auditoría y consulta de asignaturas y grupos registrados en la institución.' }}
          </p>
        </div>

        @if (canManage()) {
          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="openCreateModal()"
              class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nueva Clase</span>
            </button>
          </div>
        }
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="relative w-full sm:max-w-xs">
          <input
            type="text"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            placeholder="Buscar por asignatura..."
            class="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white placeholder:text-text-muted"
          />
          <svg class="w-4 h-4 absolute left-3 top-2.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div class="flex items-center gap-2 text-xs text-text-muted">
          <span class="font-bold text-slate-900 dark:text-white">{{ filteredClassrooms().length }}</span>
          <span>clase(s) registrada(s)</span>
        </div>
      </div>

      <!-- Estado de Carga -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-20">
          <svg class="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      } @else {
        @if (filteredClassrooms().length === 0) {
          <!-- Estado Vacío -->
          <div class="p-8 sm:p-12 rounded-3xl border border-border bg-surface text-center max-w-2xl mx-auto space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto shadow-inner">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">
                {{ searchQuery() ? 'No se encontraron clases coincidentes' : 'Aún no tienes clases registradas' }}
              </h3>
              <p class="text-sm text-text-muted mt-1.5 max-w-md mx-auto">
                {{ searchQuery() 
                  ? 'Intenta con otro término de búsqueda.' 
                  : 'Crea tu primera clase (ej: Biología) para luego añadir grupos (ej: Décimo A) y permitir que los estudiantes se unan.' }}
              </p>
            </div>
            @if (canManage() && !searchQuery()) {
              <div class="pt-2">
                <button
                  type="button"
                  (click)="openCreateModal()"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Crear Primera Clase</span>
                </button>
              </div>
            }
          </div>
        } @else {
          <!-- Cuadrícula Responsiva de Clases -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (c of filteredClassrooms(); track c.id) {
              <div class="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-all hover:shadow-md group">
                <div>
                  <!-- Encabezado de la Tarjeta -->
                  <div class="flex items-start justify-between gap-3 mb-2">
                    <div class="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>

                    <div class="flex items-center gap-1.5">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {{ c.grupos_clases ? c.grupos_clases.length : 0 }} grupo(s)
                      </span>
                      @if (canManage()) {
                        <button
                          type="button"
                          (click)="openEditModal(c)"
                          class="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Editar clase"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          (click)="confirmDeleteClassroom(c)"
                          class="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Eliminar clase"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      }
                    </div>
                  </div>

                  <!-- Título de la Clase -->
                  <h3 class="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {{ c.nombre }}
                  </h3>

                  @if (c.descripcion) {
                    <p class="text-xs text-text-muted mt-2 line-clamp-2 leading-relaxed">
                      {{ c.descripcion }}
                    </p>
                  }

                  @if (c.docente_nombre && !isDocente()) {
                    <p class="text-xs font-medium text-slate-700 dark:text-slate-300 mt-2">
                      Docente: {{ c.docente_nombre }}
                    </p>
                  }

                  <!-- Badges de Grupos Asociados -->
                  <div class="mt-4 pt-3 border-t border-border/60">
                    <span class="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                      Grupos Asignados
                    </span>
                    @if (c.grupos_clases && c.grupos_clases.length > 0) {
                      <div class="flex flex-wrap gap-1.5">
                        @for (g of c.grupos_clases; track g.id) {
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-bg border border-border text-slate-800 dark:text-slate-200">
                            <span>{{ g.nombre }}</span>
                            @if (g.codigo) {
                              <span class="font-mono text-[10px] text-text-muted">({{ g.codigo }})</span>
                            }
                          </span>
                        }
                      </div>
                    } @else {
                      <p class="text-xs text-text-muted italic">Sin grupos aún. Crea uno para comenzar.</p>
                    }
                  </div>
                </div>

                <!-- Footer de la Tarjeta -->
                <div class="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3">
                  <span class="text-xs text-text-muted flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{{ c.estudiantes_count || 0 }} estudiantes</span>
                  </span>

                  <a
                    [routerLink]="['/classrooms', c.id]"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-colors shadow-2xs"
                  >
                    <span>Gestionar Grupos</span>
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- MODAL: CREAR / EDITAR CLASE -->
      @if (showClassModal()) {
        <div
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div class="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-4 sm:p-5 border-b border-border">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </span>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  {{ isEditing() ? 'Editar Clase' : 'Crear Nueva Clase' }}
                </h3>
              </div>
              <button
                type="button"
                (click)="closeClassModal()"
                class="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Cerrar modal"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Body -->
            <form [formGroup]="classForm" (ngSubmit)="onClassSubmit()" class="p-4 sm:p-6 space-y-4">
              <div>
                <label for="class-name" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Nombre de la Clase / Asignatura *
                </label>
                <input
                  id="class-name"
                  type="text"
                  formControlName="nombre"
                  placeholder="Ej: Biología, Matemáticas 10°, etc."
                  class="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted"
                />
                @if (classForm.get('nombre')?.touched && classForm.get('nombre')?.hasError('required')) {
                  <p class="text-red-500 text-xs mt-1">El nombre de la clase es obligatorio</p>
                }
              </div>

              <div>
                <label for="class-desc" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Descripción (Opcional)
                </label>
                <textarea
                  id="class-desc"
                  rows="3"
                  formControlName="descripcion"
                  placeholder="Objetivos pedagógicos, contenido curricular, etc."
                  class="w-full px-4 py-2 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted leading-relaxed"
                ></textarea>
              </div>

              <!-- Modal Footer -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  (click)="closeClassModal()"
                  class="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="classForm.invalid || isSaving()"
                  class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  @if (isSaving()) {
                    <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Guardando...</span>
                  } @else {
                    <span>{{ isEditing() ? 'Actualizar Clase' : 'Guardar Clase' }}</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: CONFIRMAR ELIMINACIÓN -->
      @if (classroomToDelete()) {
        <div
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div class="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div class="w-12 h-12 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="text-center">
              <h3 class="text-base font-bold text-slate-900 dark:text-white">
                ¿Eliminar la clase "{{ classroomToDelete()?.nombre }}"?
              </h3>
              <p class="text-xs text-text-muted mt-2 leading-relaxed">
                Esta acción eliminará permanentemente la clase y todos los grupos asignados a ella. Los estudiantes perderán acceso a sus contenidos.
              </p>
            </div>
            <div class="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                (click)="classroomToDelete.set(null)"
                class="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="onDeleteSubmit()"
                class="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors cursor-pointer"
              >
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ClassroomsComponent implements OnInit {
  private classroomService = inject(ClassroomService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  classrooms = signal<Classroom[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  searchQuery = signal('');

  showClassModal = signal(false);
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  classroomToDelete = signal<Classroom | null>(null);

  classForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    descripcion: [''],
  });

  userRole = computed(() => this.authService.currentUser()?.role || 'estudiante');
  isDocente = computed(() => this.userRole() === 'docente');
  canManage = computed(() => this.userRole() === 'docente');

  filteredClassrooms = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.classrooms();
    return this.classrooms().filter((c) =>
      c.nombre.toLowerCase().includes(q) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(q)) ||
      (c.docente_nombre && c.docente_nombre.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.loadClassrooms();
  }

  loadClassrooms(): void {
    this.isLoading.set(true);
    this.classroomService.getClassrooms().subscribe({
      next: (data) => {
        this.classrooms.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando clases:', err);
        this.notificationService.error('No se pudieron cargar las clases');
        this.isLoading.set(false);
      },
    });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.classForm.reset({ nombre: '', descripcion: '' });
    this.showClassModal.set(true);
  }

  openEditModal(c: Classroom): void {
    this.isEditing.set(true);
    this.editingId.set(c.id);
    this.classForm.patchValue({
      nombre: c.nombre,
      descripcion: c.descripcion || '',
    });
    this.showClassModal.set(true);
  }

  closeClassModal(): void {
    this.showClassModal.set(false);
    this.isEditing.set(false);
    this.editingId.set(null);
  }

  onClassSubmit(): void {
    if (this.classForm.invalid) return;

    this.isSaving.set(true);
    const formValue = this.classForm.value;

    if (this.isEditing() && this.editingId()) {
      this.classroomService.updateClassroom(this.editingId()!, formValue).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeClassModal();
          this.notificationService.success('Clase actualizada correctamente');
          this.loadClassrooms();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.notificationService.error(err.error?.detail || 'Error al actualizar la clase');
        },
      });
    } else {
      this.classroomService.createClassroom(formValue).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeClassModal();
          this.notificationService.success('Clase creada correctamente');
          this.loadClassrooms();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.notificationService.error(err.error?.detail || 'Error al crear la clase');
        },
      });
    }
  }

  confirmDeleteClassroom(c: Classroom): void {
    this.classroomToDelete.set(c);
  }

  onDeleteSubmit(): void {
    const c = this.classroomToDelete();
    if (!c) return;

    this.classroomService.deleteClassroom(c.id).subscribe({
      next: () => {
        this.classroomToDelete.set(null);
        this.notificationService.success(`Clase "${c.nombre}" eliminada`);
        this.loadClassrooms();
      },
      error: (err) => {
        this.classroomToDelete.set(null);
        this.notificationService.error(err.error?.detail || 'Error al eliminar la clase');
      },
    });
  }
}
