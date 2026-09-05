import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DashboardService, DashboardStats } from '../../../../core/services/dashboard.service';

interface GradeMetric {
  grade: string;
  participationRate: number;
  totalCoins: number;
  activeClassrooms: number;
}

interface RecentActivityAudit {
  id: number | string;
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
            <span class="font-mono text-slate-900 dark:text-white">Panel de Rectoría / Admin</span>
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

      @if (isLoading()) {
        <div class="flex justify-center items-center py-20">
          <svg class="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      } @else {
        <!-- Métricas Macroeconómicas y Poblacionales -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Estudiantes Matriculados -->
          <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between">
            <span class="text-xs font-medium text-text-muted">Estudiantes Matriculados</span>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {{ stats()?.total_students || 0 }}
              </div>
              <p class="text-xs text-text-muted mt-1">Registrados en la plataforma</p>
            </div>
          </div>

          <!-- Docentes Registrados -->
          <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between">
            <span class="text-xs font-medium text-text-muted">Docentes Activos</span>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {{ stats()?.total_teachers || 0 }}
              </div>
              <p class="text-xs text-text-muted mt-1">Con acceso al sistema</p>
            </div>
          </div>

          <!-- Aulas en Operación -->
          <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between">
            <span class="text-xs font-medium text-text-muted">Aulas Virtuales</span>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {{ stats()?.active_classrooms || 0 }}
              </div>
              <p class="text-xs text-text-muted mt-1">Grupos escolares creados</p>
            </div>
          </div>

          <!-- Circulación de EduCoins -->
          <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between">
            <span class="text-xs font-medium text-text-muted">Circulación de EduCoins</span>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {{ stats()?.total_educoins || 0 }} EC
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
              @for (g of stats()?.grade_metrics; track g.grade) {
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
                      {{ g.totalCoins }} EC distribuidos
                    </span>
                  </div>
                </div>
              }
              
              @if (!stats()?.grade_metrics?.length) {
                <div class="text-center py-6 text-text-muted text-sm border border-dashed border-border rounded-xl">
                  Aún no hay grupos creados para mostrar métricas por grado.
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
                  <div class="font-bold text-slate-900 dark:text-white">Código DANE {{ getCodigoDane() }}</div>
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
                @for (audit of stats()?.recent_audits; track audit.id) {
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
                
                @if (!stats()?.recent_audits?.length) {
                  <li class="p-4 text-center text-text-muted border border-dashed border-border rounded-xl">
                    No hay transacciones recientes registradas.
                  </li>
                }
              </ul>
            </div>

          </div>

        </div>
      }
    </div>
  `,
})
export class RectorDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dashboardService = inject(DashboardService);

  userProfile = signal(this.authService.currentUser()?.profile);
  
  institutionName = signal(
    this.authService.currentUser()?.profile?.institucion?.nombre ||
      'Administración Global EduBid'
  );

  isLoading = signal(true);
  stats = signal<DashboardStats | null>(null);

  ngOnInit(): void {
    this.loadStats();
  }

  getCodigoDane(): string {
    const profile = this.userProfile();
    if (profile && profile.institucion) {
      return (profile.institucion as any).codigo_dane || '111001000001';
    }
    return '111001000001';
  }

  loadStats(): void {
    this.isLoading.set(true);
    this.dashboardService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando stats del dashboard:', err);
        this.isLoading.set(false);
        this.notificationService.error('No se pudieron cargar las estadísticas del panel.');
      }
    });
  }

  downloadReport(): void {
    this.notificationService.success(
      'Generando reporte consolidado de economía conductual en formato PDF/Excel...'
    );
  }
}

