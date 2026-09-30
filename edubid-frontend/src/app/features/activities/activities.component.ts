import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivityService, Activity, Submission } from '../../core/services/activity.service';
import { ClassroomService, Classroom } from '../../core/services/classroom.service';
import { GroupService, Group } from '../../core/services/group.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface border border-border text-text-muted mb-2">
            <span>{{ isDocente() ? 'Gestión Pedagógica' : 'Mis Tareas' }}</span>
            <span>•</span>
            <span class="font-mono text-slate-900 dark:text-neutral-100">Actividades</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
            {{ isDocente() ? 'Gestor de Actividades y Retos' : 'Mis Misiones y Evaluaciones' }}
          </h1>
          <p class="text-sm text-text-muted mt-1">
            {{ isDocente() 
              ? 'Publica retos pedagógicos, revisa entregas de estudiantes y califica acreditando EduCoins.' 
              : 'Completa tus actividades a tiempo para ganar EduCoins y subir de nivel en tus clases.' }}
          </p>
        </div>

        @if (isDocente()) {
          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="openCreateModal()"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Nueva Actividad</span>
            </button>
          </div>
        }
      </div>

      <!-- Filtros para Docente (Cascada: Clase -> Grupo) -->
      @if (isDocente()) {
        <div class="p-4 rounded-2xl border border-border bg-surface flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-xs font-semibold text-text-muted mb-1">Filtrar por Asignatura</label>
            <select
              [ngModel]="selectedClassroomId()"
              (ngModelChange)="onClassroomSelect($event)"
              class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-xs font-medium text-text focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option [ngValue]="null">Todas las asignaturas</option>
              @for (c of classrooms(); track c.id) {
                <option [ngValue]="c.id">{{ c.nombre }}</option>
              }
            </select>
          </div>

          <div class="flex-1 min-w-[200px]">
            <label class="block text-xs font-semibold text-text-muted mb-1">Filtrar por Grupo</label>
            <select
              [ngModel]="selectedGroupId()"
              (ngModelChange)="onGroupSelect($event)"
              class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-xs font-medium text-text focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option [ngValue]="null">Todos los grupos</option>
              @for (g of filteredGroups(); track g.id) {
                <option [ngValue]="g.id">{{ g.nombre }} ({{ g.codigo }})</option>
              }
            </select>
          </div>
        </div>
      }

      <!-- Indicador de Carga -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-20">
          <svg class="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      } @else {
        <!-- Grid de Actividades -->
        @if (activities().length === 0) {
          <div class="text-center py-16 space-y-4 rounded-3xl border border-dashed border-border bg-surface/50 p-8">
            <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-slate-900 dark:text-neutral-100 text-lg">No hay actividades disponibles</h3>
              <p class="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                {{ isDocente() 
                  ? 'Crea tu primer reto formativo para asignar puntos de experiencia y EduCoins.' 
                  : 'Estás al día con tus entregas académicas. ¡Buen trabajo!' }}
              </p>
            </div>
            @if (isDocente()) {
              <button
                type="button"
                (click)="openCreateModal()"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs cursor-pointer"
              >
                + Crear Primera Actividad
              </button>
            }
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (act of activities(); track act.id) {
              <div class="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between hover:border-primary/40 transition-all hover:shadow-md space-y-4">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-3">
                    <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full" [ngClass]="getTipoBadge(act.tipo)">
                      {{ act.tipo }}
                    </span>

                    <span class="text-xs font-mono font-bold" [ngClass]="isVencida(act.fecha_entrega) ? 'text-red-500' : 'text-emerald-500'">
                      {{ getTimeRemaining(act.fecha_entrega) }}
                    </span>
                  </div>

                  <h3 class="text-base font-bold text-slate-900 dark:text-neutral-100 line-clamp-1">
                    {{ act.nombre }}
                  </h3>

                  @if (act.descripcion) {
                    <p class="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">
                      {{ act.descripcion }}
                    </p>
                  }

                  <div class="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                    <span class="flex items-center gap-1 font-bold text-amber-500">
                      🪙 +{{ act.valor_educoins }} EC
                    </span>
                    <span class="text-text-muted">
                      +{{ act.puntos_experiencia }} XP
                    </span>
                  </div>
                </div>

                <!-- Acciones según rol -->
                <div class="pt-3 border-t border-border flex items-center justify-between gap-2">
                  @if (isDocente()) {
                    <button
                      type="button"
                      (click)="viewSubmissions(act)"
                      class="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-bg hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text transition-colors text-center cursor-pointer"
                    >
                      Entregas
                    </button>
                    <button
                      type="button"
                      (click)="deleteActivity(act)"
                      class="p-2 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Eliminar actividad"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  } @else {
                    <button
                      type="button"
                      (click)="openSubmitModal(act)"
                      [disabled]="isVencida(act.fecha_entrega)"
                      class="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 transition-all text-center cursor-pointer"
                    >
                      {{ isVencida(act.fecha_entrega) ? 'Vencida' : 'Realizar Entrega' }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- MODAL CREAR ACTIVIDAD (DOCENTE) -->
      @if (showCreateModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" (click)="closeCreateModal()">
          <div class="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between pb-3 border-b border-border">
              <h3 class="font-bold text-slate-900 dark:text-neutral-100 text-base">Crear Nueva Actividad</h3>
              <button type="button" (click)="closeCreateModal()" class="p-1 rounded-lg text-text-muted hover:text-text cursor-pointer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form [formGroup]="activityForm" (ngSubmit)="onCreateSubmit()" class="space-y-4 text-xs">
              <div>
                <label class="block font-semibold text-text-muted mb-1">Grupo Destino *</label>
                <select formControlName="group" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none">
                  <option value="">Selecciona un grupo</option>
                  @for (g of groups(); track g.id) {
                    <option [value]="g.id">{{ g.nombre }} ({{ g.classroom_nombre || 'Clase' }})</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-text-muted mb-1">Tipo de Actividad *</label>
                  <select formControlName="tipo" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none">
                    <option value="reto">Reto</option>
                    <option value="mision">Misión</option>
                    <option value="proyecto">Proyecto</option>
                    <option value="evaluacion">Evaluación</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-text-muted mb-1">Fecha Límite *</label>
                  <input type="datetime-local" formControlName="fecha_entrega" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
              </div>

              <div>
                <label class="block font-semibold text-text-muted mb-1">Nombre de la Actividad *</label>
                <input type="text" formControlName="nombre" placeholder="Ej: Reto de Álgebra Lineal" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>

              <div>
                <label class="block font-semibold text-text-muted mb-1">Instrucciones</label>
                <textarea formControlName="descripcion" rows="3" placeholder="Describe los requisitos de la actividad..." class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none resize-none"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-text-muted mb-1">Recompensa EduCoins *</label>
                  <input type="number" formControlName="valor_educoins" min="1" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none font-mono" />
                </div>
                <div>
                  <label class="block font-semibold text-text-muted mb-1">Puntos Experiencia (XP) *</label>
                  <input type="number" formControlName="puntos_experiencia" min="1" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none font-mono" />
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" (click)="closeCreateModal()" class="px-4 py-2 rounded-xl border border-border hover:bg-bg text-text-muted cursor-pointer">Cancelar</button>
                <button type="submit" [disabled]="activityForm.invalid || isSaving()" class="px-5 py-2 rounded-xl text-white bg-primary hover:bg-primary-hover disabled:opacity-50 cursor-pointer font-semibold">
                  {{ isSaving() ? 'Guardando...' : 'Publicar Actividad' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL VER ENTREGAS (DOCENTE) -->
      @if (showSubmissionsModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" (click)="showSubmissionsModal.set(false)">
          <div class="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 max-h-[85vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 class="font-bold text-slate-900 dark:text-neutral-100 text-base">Entregas de Estudiantes</h3>
                <p class="text-xs text-text-muted">{{ viewingActivity()?.nombre }}</p>
              </div>
              <button type="button" (click)="showSubmissionsModal.set(false)" class="p-1 rounded-lg text-text-muted hover:text-text cursor-pointer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="overflow-y-auto flex-1 space-y-3">
              @for (sub of submissions(); track sub.id) {
                <div class="p-3.5 rounded-xl border border-border bg-bg/50 flex items-center justify-between gap-3">
                  <div>
                    <h4 class="font-bold text-xs text-text">{{ sub.estudiante_nombre || 'Estudiante' }}</h4>
                    <p class="text-[11px] text-text-muted">{{ sub.estudiante_email }}</p>
                    <span class="text-[10px] font-mono text-text-muted block mt-1">Entregado: {{ formatDate(sub.creado) }}</span>
                  </div>

                  <div class="flex items-center gap-3">
                    @if (sub.calificacion !== null && sub.calificacion !== undefined) {
                      <div class="text-right">
                        <span class="text-xs font-bold text-emerald-500 font-mono">{{ sub.calificacion }}/100</span>
                        <span class="text-[10px] text-text-muted block">Calificado</span>
                      </div>
                    } @else {
                      <button
                        type="button"
                        (click)="openGradeModal(sub)"
                        class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-hover transition cursor-pointer"
                      >
                        Calificar
                      </button>
                    }
                  </div>
                </div>
              } @empty {
                <div class="text-center py-8 text-xs text-text-muted">
                  No hay entregas registradas para esta actividad todavía.
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- MODAL CALIFICAR SUBMISSION -->
      @if (showGradeModal()) {
        <div class="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" (click)="showGradeModal.set(false)">
          <div class="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl p-5 space-y-4" (click)="$event.stopPropagation()">
            <h3 class="font-bold text-sm text-text">Calificar Entrega</h3>
            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-semibold text-text-muted mb-1">Calificación (0 a 100) *</label>
                <input type="number" min="0" max="100" [(ngModel)]="gradeNota" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
              <div>
                <label class="block font-semibold text-text-muted mb-1">Retroalimentación</label>
                <textarea rows="2" [(ngModel)]="gradeComentario" placeholder="Comentarios del docente..." class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none resize-none"></textarea>
              </div>
              <div class="flex justify-end gap-2 pt-2">
                <button type="button" (click)="showGradeModal.set(false)" class="px-3 py-1.5 rounded-xl border border-border hover:bg-bg text-text-muted cursor-pointer">Cancelar</button>
                <button type="button" (click)="submitGrade()" [disabled]="isSaving()" class="px-4 py-1.5 rounded-xl text-white bg-primary hover:bg-primary-hover cursor-pointer font-semibold">Guardar y Acreditar</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL ENTREGAR TAREA (ESTUDIANTE) -->
      @if (showSubmitModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" (click)="showSubmitModal.set(false)">
          <div class="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-4" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between pb-3 border-b border-border">
              <h3 class="font-bold text-sm text-text">Entregar Actividad</h3>
              <button type="button" (click)="showSubmitModal.set(false)" class="p-1 rounded-lg text-text-muted hover:text-text cursor-pointer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-semibold text-text-muted mb-1">Descripción o respuesta</label>
                <textarea rows="3" [(ngModel)]="submitContenido" placeholder="Escribe aquí tu respuesta o detalles..." class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none resize-none"></textarea>
              </div>
              <div>
                <label class="block font-semibold text-text-muted mb-1">Subir Archivo (opcional)</label>
                <input type="file" (change)="onFileSelected($event)" class="w-full text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
              </div>
              <div class="flex justify-end gap-2 pt-3 border-t border-border">
                <button type="button" (click)="showSubmitModal.set(false)" class="px-3 py-1.5 rounded-xl border border-border hover:bg-bg text-text-muted cursor-pointer">Cancelar</button>
                <button type="button" (click)="submitWork()" [disabled]="isSaving()" class="px-4 py-1.5 rounded-xl text-white bg-primary hover:bg-primary-hover cursor-pointer font-semibold">
                  {{ isSaving() ? 'Enviando...' : 'Enviar Entrega' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ActivitiesComponent implements OnInit {
  private activityService = inject(ActivityService);
  private classroomService = inject(ClassroomService);
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private notifService = inject(NotificationService);
  private fb = inject(FormBuilder);

  userRole = computed(() => this.authService.currentUser()?.role || 'estudiante');
  isDocente = computed(() => ['docente', 'admin', 'rector', 'coordinador'].includes(this.userRole()));

  activities = signal<Activity[]>([]);
  classrooms = signal<Classroom[]>([]);
  groups = signal<Group[]>([]);
  submissions = signal<Submission[]>([]);

  selectedClassroomId = signal<number | null>(null);
  selectedGroupId = signal<number | null>(null);

  isLoading = signal(false);
  isSaving = signal(false);
  showCreateModal = signal(false);
  showSubmissionsModal = signal(false);
  showGradeModal = signal(false);
  showSubmitModal = signal(false);

  viewingActivity = signal<Activity | null>(null);
  selectedSubmission = signal<Submission | null>(null);

  gradeNota = 100;
  gradeComentario = '';
  submitContenido = '';
  selectedFile: File | null = null;

  filteredGroups = computed(() => {
    const cid = this.selectedClassroomId();
    if (!cid) return this.groups();
    return this.groups().filter(g => g.classroom === cid);
  });

  activityForm: FormGroup = this.fb.group({
    group: ['', Validators.required],
    tipo: ['reto', Validators.required],
    nombre: ['', Validators.required],
    descripcion: [''],
    fecha_entrega: ['', Validators.required],
    valor_educoins: [100, [Validators.required, Validators.min(1)]],
    puntos_experiencia: [10, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    if (this.isDocente()) {
      this.classroomService.getClassrooms().subscribe({
        next: (res) => this.classrooms.set(res || [])
      });
      this.groupService.getGroups().subscribe({
        next: (res) => this.groups.set(res || [])
      });
    }
    this.loadActivities();
  }

  loadActivities(): void {
    const gid = this.selectedGroupId();
    this.activityService.getActivities(gid || undefined).subscribe({
      next: (res) => {
        this.activities.set(res || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onClassroomSelect(id: number | null): void {
    this.selectedClassroomId.set(id);
    this.selectedGroupId.set(null);
    this.loadActivities();
  }

  onGroupSelect(id: number | null): void {
    this.selectedGroupId.set(id);
    this.loadActivities();
  }

  openCreateModal(): void {
    this.activityForm.reset({
      group: this.selectedGroupId() || '',
      tipo: 'reto',
      nombre: '',
      descripcion: '',
      valor_educoins: 100,
      puntos_experiencia: 10
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  onCreateSubmit(): void {
    if (this.activityForm.invalid || this.isSaving()) return;
    this.isSaving.set(true);
    const val = this.activityForm.value;
    const payload = {
      ...val,
      group: Number(val.group),
      fecha_entrega: new Date(val.fecha_entrega).toISOString(),
      habilitada: true
    };
    this.activityService.createActivity(payload).subscribe({
      next: (act) => {
        this.isSaving.set(false);
        this.closeCreateModal();
        this.notifService.success(`Actividad "${act.nombre}" creada con éxito.`);
        this.loadActivities();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notifService.error(err.error?.detail || 'Error al crear la actividad.');
      }
    });
  }

  deleteActivity(act: Activity): void {
    if (!confirm(`¿Eliminar la actividad "${act.nombre}"?`)) return;
    this.activityService.deleteActivity(act.id).subscribe({
      next: () => {
        this.notifService.success('Actividad eliminada.');
        this.loadActivities();
      },
      error: () => this.notifService.error('Error al eliminar la actividad.')
    });
  }

  viewSubmissions(act: Activity): void {
    this.viewingActivity.set(act);
    this.activityService.getSubmissions(act.id).subscribe({
      next: (subs) => {
        this.submissions.set(subs || []);
        this.showSubmissionsModal.set(true);
      }
    });
  }

  openGradeModal(sub: Submission): void {
    this.selectedSubmission.set(sub);
    this.gradeNota = 100;
    this.gradeComentario = '';
    this.showGradeModal.set(true);
  }

  submitGrade(): void {
    const sub = this.selectedSubmission();
    if (!sub || this.isSaving()) return;
    this.isSaving.set(true);
    this.activityService.gradeSubmission(sub.id, { nota: this.gradeNota, retroalimentacion: this.gradeComentario }).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.showGradeModal.set(false);
        this.notifService.success(`¡Calificado con éxito! +${res.coins_ganados} EduCoins acreditados.`);
        if (this.viewingActivity()) {
          this.viewSubmissions(this.viewingActivity()!);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notifService.error(err.error?.detail || 'Error al calificar.');
      }
    });
  }

  openSubmitModal(act: Activity): void {
    this.viewingActivity.set(act);
    this.submitContenido = '';
    this.selectedFile = null;
    this.showSubmitModal.set(true);
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  submitWork(): void {
    const act = this.viewingActivity();
    if (!act || this.isSaving()) return;
    this.isSaving.set(true);
    const fd = new FormData();
    fd.append('activity', String(act.id));
    if (this.submitContenido) fd.append('contenido', this.submitContenido);
    if (this.selectedFile) fd.append('archivo', this.selectedFile);

    this.activityService.submitActivity(fd).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showSubmitModal.set(false);
        this.notifService.success('¡Actividad enviada con éxito!');
        this.loadActivities();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notifService.error(err.error?.detail || 'Error al enviar la entrega.');
      }
    });
  }

  getTipoBadge(tipo: string): string {
    const map: Record<string, string> = {
      reto: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      mision: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      proyecto: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
      evaluacion: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    };
    return map[tipo] || 'bg-neutral-100 text-text-muted';
  }

  getTimeRemaining(fecha: string): string {
    const diff = new Date(fecha).getTime() - Date.now();
    if (diff <= 0) return 'Vencida';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m restantes`;
  }

  isVencida(fecha: string): boolean {
    return new Date(fecha).getTime() < Date.now();
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }
}
