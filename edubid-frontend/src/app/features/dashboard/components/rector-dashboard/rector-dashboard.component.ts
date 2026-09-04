import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface GradeMetric {
  grade: string;
  participationRate: number;
  totalCoins: number;
  activeClassrooms: number;
}

interface RecentActivityAudit {
  id: number;
  timestamp: string;
  action: string;
  classroom: string;
  teacher: string;
}

@Component({
  selector: 'app-rector-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      <!-- Encabezado de Rectoría -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface border border-border text-text-muted mb-2">
            <span>Gobierno Escolar</span>
            <span>•</span>
            <span class="font-mono text-slate-900 dark:text-white">Panel de Rectoría</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {{ institutionName() }}
          </h1>
          <p class="text-sm text-text-muted mt-1">
            Supervisión institucional, auditoría de economía conductual y gestión de identidad.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="downloadReport()"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-xs transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Exportar Reporte DANE</span>
          </button>
        </div>
      </div>

      <!-- Métricas Macroeconómicas y Poblacionales -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Estudiantes Matriculados -->
        <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between">
          <span class="text-xs font-medium text-text-muted">Estudiantes Matriculados</span>
          <div class="mt-4">
            <div class="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              840
            </div>
            <p class="text-xs text-text-muted mt-1">98.2% con participación activa</p>
          </div>
        </div>

        <!-- Docentes Registrados -->
        <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between">
          <span class="text-xs font-medium text-text-muted">Docentes Activos</span>
          <div class="mt-4">
            <div class="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              42
            </div>
            <p class="text-xs text-text-muted mt-1">Con aulas gamificadas creadas</p>
          </div>
        </div>

        <!-- Aulas en Operación -->
        <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between">
          <span class="text-xs font-medium text-text-muted">Aulas Virtuales</span>
          <div class="mt-4">
            <div class="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              28
            </div>
            <p class="text-xs text-text-muted mt-1">Grupos escolares activos</p>
          </div>
        </div>

        <!-- Circulación de EduCoins -->
        <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between">
          <span class="text-xs font-medium text-text-muted">Circulación de EduCoins</span>
          <div class="mt-4">
            <div class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              48,250 🪙
            </div>
            <p class="text-xs text-text-muted mt-1">Emitidos por méritos académicos</p>
          </div>
        </div>
      </div>

      <!-- Grid Principal: Identidad & Indicadores por Grado -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Columna Izquierda (7 cols): Rendimiento por Grados -->
        <div class="lg:col-span-7 space-y-4">
          <div class="flex items-center justify-between border-b border-border pb-3">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Participación por Grado Escolar
            </h2>
            <span class="text-xs text-text-muted">Métricas de Engagement</span>
          </div>

          <div class="space-y-4">
            @for (g of gradeMetrics(); track g.grade) {
              <div class="p-5 rounded-2xl border border-border bg-surface space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="font-bold text-slate-900 dark:text-white text-base">
                    {{ g.grade }}
                  </h3>
                  <span class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {{ g.participationRate }}% participación
                  </span>
                </div>

                <!-- Barra de Progreso -->
                <div class="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div
                    class="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500"
                    [style.width.%]="g.participationRate"
                  ></div>
                </div>

                <div class="flex items-center justify-between text-xs text-text-muted pt-1">
                  <span>{{ g.activeClassrooms }} aulas activas</span>
                  <span class="font-mono font-semibold text-slate-900 dark:text-white">
                    {{ g.totalCoins }} 🪙 distribuidos
                  </span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Columna Derecha (5 cols): Identidad y Auditoría -->
        <div class="lg:col-span-5 space-y-6">
          
          <!-- Identidad de Marca Institucional (White-label) -->
          <div class="p-5 rounded-2xl border border-border bg-surface space-y-3">
            <h3 class="font-bold text-slate-900 dark:text-white text-base">
              Identidad Institucional
            </h3>
            <p class="text-xs text-text-muted leading-relaxed">
              EduBid adapta la paleta cromática y logotipo para reflejar la identidad oficial de su colegio.
            </p>
            <div class="pt-2 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                EB
              </div>
              <div class="text-xs">
                <div class="font-bold text-slate-900 dark:text-white">Código DANE 111001000001</div>
                <span class="text-text-muted">Acreditación MEN vigente</span>
              </div>
            </div>
          </div>

          <!-- Auditoría de Transacciones Recientes -->
          <div class="space-y-3">
            <div class="border-b border-border pb-2 flex items-center justify-between">
              <h3 class="font-bold text-slate-900 dark:text-white text-sm">
                Registro de Auditoría
              </h3>
              <span class="text-[11px] text-text-muted font-mono">Inmutable</span>
            </div>

            <ul class="space-y-2 text-xs">
              @for (audit of recentAudits(); track audit.id) {
                <li class="p-3 rounded-xl border border-border bg-surface space-y-1">
                  <div class="flex items-center justify-between text-[11px] text-text-muted">
                    <span>{{ audit.classroom }}</span>
                    <span class="font-mono">{{ audit.timestamp }}</span>
                  </div>
                  <div class="font-semibold text-slate-900 dark:text-white">
                    {{ audit.action }}
                  </div>
                  <div class="text-[11px] text-text-muted">
                    Responsable: {{ audit.teacher }}
                  </div>
                </li>
              }
            </ul>
          </div>

        </div>

      </div>
    </div>
  `,
})
export class RectorDashboardComponent {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  institutionName = signal(
    this.authService.currentUser()?.profile?.institucion?.nombre ||
      'Institución Educativa Demo'
  );

  gradeMetrics = signal<GradeMetric[]>([
    {
      grade: 'Grado 11 (Media Vocacional)',
      participationRate: 94,
      totalCoins: 18500,
      activeClassrooms: 6,
    },
    {
      grade: 'Grado 10 (Media Académica)',
      participationRate: 91,
      totalCoins: 14200,
      activeClassrooms: 8,
    },
    {
      grade: 'Grado 9 (Básica Secundaria)',
      participationRate: 88,
      totalCoins: 9800,
      activeClassrooms: 7,
    },
    {
      grade: 'Grado 8 (Básica Secundaria)',
      participationRate: 82,
      totalCoins: 5750,
      activeClassrooms: 7,
    },
  ]);

  recentAudits = signal<RecentActivityAudit[]>([
    {
      id: 1,
      timestamp: 'Hoy, 14:32',
      action: 'Cierre de Subasta: Comodín de Examen (Ganador: D. Gómez, 90 EduCoins)',
      classroom: 'Matemáticas 10°A',
      teacher: 'Prof. García',
    },
    {
      id: 2,
      timestamp: 'Hoy, 11:20',
      action: 'Acreditación colectiva de méritos (+960 EduCoins a 32 estudiantes)',
      classroom: 'Física Mecánica',
      teacher: 'Prof. Rodríguez',
    },
    {
      id: 3,
      timestamp: 'Ayer, 16:45',
      action: 'Apertura de Subasta: Pases de Sustentación',
      classroom: 'Lenguaje y Comunicación',
      teacher: 'Prof. Pérez',
    },
  ]);

  downloadReport(): void {
    this.notificationService.success(
      'Generando reporte consolidado de economía conductual en formato PDF/Excel...'
    );
  }
}
