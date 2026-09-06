import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ClassroomService, Classroom } from '../../../../core/services/classroom.service';
import { ActivityService, Submission } from '../../../../core/services/activity.service';
import { AuctionService, Auction } from '../../../../core/services/auction.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      <!-- Encabezado del Docente -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface border border-border text-text-muted mb-2">
            <span>Gestión Pedagógica</span>
            <span>•</span>
            <span class="font-mono text-slate-900 dark:text-white">Panel Docente</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Prof. {{ teacherName() }}
          </h1>
          <p class="text-sm text-text-muted mt-1">
            Administra tus asignaturas, califica entregas con recompensas y programa subastas de aula.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <a
            routerLink="/classrooms"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-xs transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Gestionar Clases</span>
          </a>
        </div>
      </div>

      @if (isLoading()) {
        <div class="flex justify-center items-center py-20">
          <svg class="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      } @else {
        <!-- Métricas Clave del Docente (Datos Reales) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Clases Activas -->
          <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
            <span class="text-xs font-medium text-text-muted">Clases Activas</span>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {{ classrooms().length }}
              </div>
              <p class="text-xs text-text-muted mt-1">Asignaturas a tu cargo</p>
            </div>
          </div>

          <!-- Total Estudiantes -->
          <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
            <span class="text-xs font-medium text-text-muted">Estudiantes Matriculados</span>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {{ totalStudents() }}
              </div>
              <p class="text-xs text-text-muted mt-1">En todos tus grupos</p>
            </div>
          </div>

          <!-- Por Calificar -->
          <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
            <span class="text-xs font-medium text-text-muted">Por Calificar</span>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {{ pendingReviews().length }}
              </div>
              <p class="text-xs text-text-muted mt-1">Entregas pendientes</p>
            </div>
          </div>

          <!-- Subastas Activas -->
          <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
            <span class="text-xs font-medium text-text-muted">Subastas Activas</span>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {{ activeAuctionsCount() }}
              </div>
              <p class="text-xs text-text-muted mt-1">Incentivos en subasta</p>
            </div>
          </div>
        </div>

        <!-- Grid Principal: Clases & Entregas por Calificar -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <!-- Columna Izquierda (7 cols): Mis Clases & Grupos -->
          <div class="lg:col-span-7 space-y-6">
            <div class="flex items-center justify-between border-b border-border pb-3">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Mis Clases y Asignaturas
              </h2>
              <a routerLink="/classrooms" class="text-xs font-medium text-text-muted hover:text-text">
                Ver todas →
              </a>
            </div>

            @if (classrooms().length === 0) {
              <div class="p-8 rounded-2xl border border-border bg-surface text-center space-y-3">
                <div class="w-12 h-12 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 class="font-bold text-slate-900 dark:text-white text-base">Aún no tienes clases registradas</h3>
                <p class="text-xs text-text-muted max-w-sm mx-auto">
                  Crea tu primera clase para comenzar a gestionar materias, añadir grupos de estudiantes y asignar actividades gamificadas.
                </p>
                <div class="pt-2">
                  <a
                    routerLink="/classrooms"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover transition-colors"
                  >
                    Crear mi primera clase
                  </a>
                </div>
              </div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                @for (c of classrooms(); track c.id) {
                  <div class="p-5 rounded-2xl border border-border bg-surface hover:border-slate-400 dark:hover:border-slate-600 transition-colors flex flex-col justify-between space-y-4">
                    <div class="space-y-1">
                      <div class="flex items-center justify-between">
                        <span class="text-[11px] font-mono px-2 py-0.5 rounded-md bg-bg border border-border text-text-muted">
                          Clase #{{ c.id }}
                        </span>
                        <span class="text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {{ c.grupos_clases ? c.grupos_clases.length : 0 }} grupo(s)
                        </span>
                      </div>
                      <h3 class="font-bold text-slate-900 dark:text-white text-base">
                        {{ c.nombre }}
                      </h3>
                      <p class="text-xs text-text-muted line-clamp-2">
                        {{ c.descripcion || 'Sin descripción' }}
                      </p>
                    </div>

                    <div class="pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                      <span>{{ c.estudiantes_count || 0 }} alumnos</span>
                      <a [routerLink]="['/classrooms', c.id]" class="font-semibold text-primary hover:underline">
                        Gestionar Grupos →
                      </a>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Subastas Pedagógicas del Aula -->
            <div class="space-y-4 pt-4">
              <div class="flex items-center justify-between border-b border-border pb-3">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></span>
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Subastas Pedagógicas Activas
                  </h2>
                </div>
                <button
                  type="button"
                  (click)="scheduleAuctionAlert()"
                  class="text-xs font-semibold text-slate-900 dark:text-white hover:underline cursor-pointer"
                >
                  + Programar subasta
                </button>
              </div>

              @if (teacherAuctions().length === 0) {
                <div class="p-6 rounded-xl border border-border bg-surface text-center text-xs text-text-muted">
                  No has programado subastas pedagógicas activas en este momento.
                </div>
              } @else {
                <div class="space-y-3">
                  @for (a of teacherAuctions(); track a.id) {
                    <div class="p-4 rounded-xl border border-border bg-surface flex items-center justify-between gap-4">
                      <div class="space-y-1">
                        <span class="text-[11px] font-semibold text-text-muted block">
                          {{ a.grupo_nombre || 'Grupo de Aula' }}
                        </span>
                        <h4 class="font-bold text-sm text-slate-900 dark:text-white">
                          {{ a.titulo }}
                        </h4>
                        <p class="text-xs text-text-muted">
                          @if (a.puja_mas_alta) {
                            Líder: <strong class="text-slate-900 dark:text-white">{{ a.puja_mas_alta.estudiante_nombre }}</strong> ({{ a.puja_mas_alta.cantidad_educoins }} EC)
                          } @else {
                            Sin ofertas aún • Mínimo: {{ a.valor_minimo_educoins }} EC
                          }
                        </p>
                      </div>

                      <div class="text-right shrink-0">
                        <span class="text-xs font-mono font-bold text-slate-900 dark:text-white block">
                          {{ a.total_pujas }} pujas
                        </span>
                        <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                          {{ a.estado === 'active' ? 'En Curso' : a.estado }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Columna Derecha (5 cols): Entregas Pendientes de Calificar -->
          <div class="lg:col-span-5 space-y-4">
            <div class="border-b border-border pb-3 flex items-center justify-between">
              <div>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Entregas por Calificar
                </h2>
                <p class="text-xs text-text-muted mt-0.5">Evalúa y acredita recompensas.</p>
              </div>
              <span class="text-xs font-mono px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted">
                {{ pendingReviews().length }} pendientes
              </span>
            </div>

            @if (pendingReviews().length === 0) {
              <div class="p-8 rounded-2xl border border-border bg-surface text-center space-y-2">
                <div class="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="font-semibold text-xs text-slate-900 dark:text-white">¡Al día!</p>
                <p class="text-xs text-text-muted">No tienes entregas pendientes de revisión en este momento.</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (rev of pendingReviews(); track rev.id) {
                  <div class="p-4 rounded-xl border border-border bg-surface space-y-3">
                    <div class="flex items-start justify-between gap-2">
                      <div class="space-y-0.5">
                        <span class="text-[11px] font-semibold text-text-muted block">
                          Entrega #{{ rev.id }}
                        </span>
                        <h4 class="font-bold text-sm text-slate-900 dark:text-white">
                          {{ rev.estudiante_nombre || 'Estudiante' }}
                        </h4>
                        <p class="text-xs text-text-muted">
                          {{ rev.activity_nombre || 'Actividad evaluativa' }}
                        </p>
                      </div>
                    </div>

                    <div class="pt-2 border-t border-border flex items-center justify-end gap-2">
                      <button
                        type="button"
                        (click)="gradeSubmission(rev)"
                        class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-hover dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-2xs transition-all cursor-pointer"
                      >
                        Revisar Entrega
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class TeacherDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private classroomService = inject(ClassroomService);
  private activityService = inject(ActivityService);
  private auctionService = inject(AuctionService);

  isLoading = signal<boolean>(true);
  classrooms = signal<Classroom[]>([]);
  pendingReviews = signal<Submission[]>([]);
  teacherAuctions = signal<Auction[]>([]);

  teacherName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.first_name} ${user.last_name}`.trim() || user.email : 'Docente';
  });

  totalStudents = computed(() => {
    return this.classrooms().reduce((acc, c) => acc + (c.estudiantes_count || 0), 0);
  });

  activeAuctionsCount = computed(() => {
    return this.teacherAuctions().filter((a) => a.estado === 'active').length;
  });

  ngOnInit(): void {
    this.loadTeacherData();
  }

  loadTeacherData(): void {
    this.isLoading.set(true);

    // 1. Cargar Aulas reales del docente
    this.classroomService.getClassrooms().subscribe({
      next: (res) => {
        this.classrooms.set(res || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.classrooms.set([]);
        this.isLoading.set(false);
      },
    });

    // 2. Cargar Entregas reales pendientes de calificación
    this.activityService.getSubmissions().subscribe({
      next: (subs) => {
        // Filtrar las que no tengan nota asignada
        const pending = (subs || []).filter((s) => s.grade === null || s.grade === undefined);
        this.pendingReviews.set(pending);
      },
      error: () => {
        this.pendingReviews.set([]);
      },
    });

    // 3. Cargar Subastas reales creadas por el docente
    this.auctionService.getAuctions().subscribe({
      next: (aucs) => {
        this.teacherAuctions.set(aucs || []);
      },
      error: () => {
        this.teacherAuctions.set([]);
      },
    });
  }

  gradeSubmission(item: Submission): void {
    this.notificationService.info(
      `Revisión de entrega #${item.id} abierta. Califica para acreditar EduCoins.`
    );
  }

  scheduleAuctionAlert(): void {
    this.notificationService.info(
      'Módulo de subastas de aula: configura incentivos formativos y fecha límite.'
    );
  }
}
