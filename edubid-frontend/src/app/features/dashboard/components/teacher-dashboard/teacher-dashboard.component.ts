import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface ClassroomSummary {
  id: number;
  name: string;
  grade: string;
  studentsCount: number;
  code: string;
  activeTasks: number;
}

interface PendingReview {
  id: number;
  studentName: string;
  taskTitle: string;
  classroom: string;
  submittedAt: string;
  suggestedCoins: number;
}

interface TeacherAuction {
  id: number;
  title: string;
  classroom: string;
  leadingBid: number;
  leadingStudent: string;
  status: 'active' | 'scheduled' | 'closed';
  timeLeft: string;
}

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
          <button
            type="button"
            (click)="createNewTaskAlert()"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-xs transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Crear Actividad</span>
          </button>
        </div>
      </div>

      <!-- Métricas Clave del Docente -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Aulas a Cargo -->
        <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between">
          <span class="text-xs font-medium text-text-muted">Aulas Activas</span>
          <div class="mt-4">
            <div class="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {{ classrooms().length }}
            </div>
            <p class="text-xs text-text-muted mt-1">Grupos matriculados</p>
          </div>
        </div>

        <!-- Total Estudiantes -->
        <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between">
          <span class="text-xs font-medium text-text-muted">Estudiantes Activos</span>
          <div class="mt-4">
            <div class="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              128
            </div>
            <p class="text-xs text-text-muted mt-1">En todas tus materias</p>
          </div>
        </div>

        <!-- Por Calificar -->
        <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between">
          <span class="text-xs font-medium text-text-muted">Por Calificar</span>
          <div class="mt-4">
            <div class="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {{ pendingReviews().length }}
            </div>
            <p class="text-xs text-text-muted mt-1">Entregas con bonificación</p>
          </div>
        </div>

        <!-- EduCoins Acreditados -->
        <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between">
          <span class="text-xs font-medium text-text-muted">EduCoins Acreditados</span>
          <div class="mt-4">
            <div class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              1,420 EC
            </div>
            <p class="text-xs text-text-muted mt-1">Recompensas este periodo</p>
          </div>
        </div>
      </div>

      <!-- Grid Principal: Aulas & Entregas por Calificar -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Columna Izquierda (7 cols): Mis Aulas a Cargo -->
        <div class="lg:col-span-7 space-y-6">
          <div class="flex items-center justify-between border-b border-border pb-3">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Mis Aulas a Cargo
            </h2>
            <a routerLink="/classrooms" class="text-xs font-medium text-text-muted hover:text-text">
              Ver todas →
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            @for (c of classrooms(); track c.id) {
              <div class="p-5 rounded-2xl border border-border bg-surface hover:border-slate-400 dark:hover:border-slate-600 transition-colors flex flex-col justify-between space-y-4">
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] font-mono px-2 py-0.5 rounded-md bg-bg border border-border text-text-muted">
                      {{ c.code }}
                    </span>
                    <span class="text-xs text-text-muted">{{ c.grade }}</span>
                  </div>
                  <h3 class="font-bold text-slate-900 dark:text-white text-base">
                    {{ c.name }}
                  </h3>
                </div>

                <div class="pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                  <span>{{ c.studentsCount }} alumnos</span>
                  <span class="font-semibold text-slate-900 dark:text-white">{{ c.activeTasks }} tareas</span>
                </div>
              </div>
            }
          </div>

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

            <div class="space-y-3">
              @for (a of teacherAuctions(); track a.id) {
                <div class="p-4 rounded-xl border border-border bg-surface flex items-center justify-between gap-4">
                  <div class="space-y-1">
                    <span class="text-[11px] font-semibold text-text-muted block">
                      {{ a.classroom }}
                    </span>
                    <h4 class="font-bold text-sm text-slate-900 dark:text-white">
                      {{ a.title }}
                    </h4>
                    <p class="text-xs text-text-muted">
                      Líder actual: <strong class="text-slate-900 dark:text-white">{{ a.leadingStudent }}</strong> ({{ a.leadingBid }} EC)
                    </p>
                  </div>

                  <div class="text-right shrink-0">
                    <span class="text-xs font-mono font-bold text-slate-900 dark:text-white block">
                      {{ a.timeLeft }}
                    </span>
                    <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                      En Curso
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Columna Derecha (5 cols): Entregas Pendientes de Calificar -->
        <div class="lg:col-span-5 space-y-4">
          <div class="border-b border-border pb-3 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Entregas por Calificar
              </h2>
              <p class="text-xs text-text-muted mt-0.5">Asigna notas y acredita méritos.</p>
            </div>
            <span class="text-xs font-mono px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted">
              {{ pendingReviews().length }} pendientes
            </span>
          </div>

          <div class="space-y-3">
            @for (rev of pendingReviews(); track rev.id) {
              <div class="p-4 rounded-xl border border-border bg-surface space-y-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="space-y-0.5">
                    <span class="text-[11px] font-semibold text-text-muted block">
                      {{ rev.classroom }} • {{ rev.submittedAt }}
                    </span>
                    <h4 class="font-bold text-sm text-slate-900 dark:text-white">
                      {{ rev.studentName }}
                    </h4>
                    <p class="text-xs text-text-muted">
                      {{ rev.taskTitle }}
                    </p>
                  </div>

                  <span class="text-xs font-bold font-mono text-emerald-600 shrink-0">
                    +{{ rev.suggestedCoins }} EC
                  </span>
                </div>

                <div class="pt-2 border-t border-border flex items-center justify-end gap-2">
                  <button
                    type="button"
                    (click)="gradeSubmission(rev)"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-2xs transition-all cursor-pointer"
                  >
                    Aprobar y Acreditar
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TeacherDashboardComponent {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  teacherName = signal(
    this.authService.currentUser()?.first_name || 'Docente'
  );

  classrooms = signal<ClassroomSummary[]>([
    {
      id: 1,
      name: 'Matemáticas 10°A',
      grade: 'Grado 10',
      studentsCount: 32,
      code: 'MAT-10A',
      activeTasks: 3,
    },
    {
      id: 2,
      name: 'Matemáticas 11°B',
      grade: 'Grado 11',
      studentsCount: 30,
      code: 'MAT-11B',
      activeTasks: 2,
    },
    {
      id: 3,
      name: 'Cálculo Avanzado',
      grade: 'Pre-Universitario',
      studentsCount: 28,
      code: 'CALC-ADV',
      activeTasks: 4,
    },
    {
      id: 4,
      name: 'Física Mecánica',
      grade: 'Grado 10',
      studentsCount: 38,
      code: 'FIS-10',
      activeTasks: 2,
    },
  ]);

  pendingReviews = signal<PendingReview[]>([
    {
      id: 201,
      studentName: 'Camila Torres',
      taskTitle: 'Taller de Límites y Continuidad',
      classroom: 'Matemáticas 10°A',
      submittedAt: 'Hace 2 horas',
      suggestedCoins: 30,
    },
    {
      id: 202,
      studentName: 'Carlos Ramos',
      taskTitle: 'Ejercicios de Derivación Implícita',
      classroom: 'Cálculo Avanzado',
      submittedAt: 'Hace 4 horas',
      suggestedCoins: 35,
    },
    {
      id: 203,
      studentName: 'Sofía Vargas',
      taskTitle: 'Guía Experimental de Caída Libre',
      classroom: 'Física Mecánica',
      submittedAt: 'Ayer',
      suggestedCoins: 25,
    },
  ]);

  teacherAuctions = signal<TeacherAuction[]>([
    {
      id: 301,
      title: 'Comodín de Examen Parcial',
      classroom: 'Matemáticas 10°A',
      leadingBid: 90,
      leadingStudent: 'Daniel Gómez',
      status: 'active',
      timeLeft: '02h 15m',
    },
    {
      id: 302,
      title: 'Turno 1 en Exposición de Proyecto',
      classroom: 'Física Mecánica',
      leadingBid: 65,
      leadingStudent: 'Mariana Ruiz',
      status: 'active',
      timeLeft: '08h 40m',
    },
  ]);

  gradeSubmission(item: PendingReview): void {
    this.pendingReviews.update((list) => list.filter((r) => r.id !== item.id));
    this.notificationService.success(
      `Actividad evaluada. Se acreditaron +${item.suggestedCoins} EduCoins a ${item.studentName}.`
    );
  }

  createNewTaskAlert(): void {
    this.notificationService.info(
      'Módulo de creación de tarea abierto. Define la rúbrica y bonificación en EduCoins.'
    );
  }

  scheduleAuctionAlert(): void {
    this.notificationService.info(
      'Configura el incentivo formativo y fecha límite para la nueva subasta.'
    );
  }
}
