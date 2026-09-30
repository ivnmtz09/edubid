import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GradeService, MyGradesResponse, StudentGrade } from '../../core/services/grade.service';
import { ClassroomService, Classroom } from '../../core/services/classroom.service';
import { GroupService, Group } from '../../core/services/group.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface border border-border text-text-muted mb-2">
            <span>Rendimiento Académico</span>
            <span>•</span>
            <span class="font-mono text-slate-900 dark:text-neutral-100">Calificaciones</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
            {{ isEstudiante() ? 'Mis Calificaciones y Recompensas' : 'Planillas de Calificaciones y Reportes' }}
          </h1>
          <p class="text-sm text-text-muted mt-1">
            {{ isEstudiante()
              ? 'Consulta tus notas obtenidas en cada actividad y los EduCoins acreditados en tu billetera.'
              : 'Supervisa el rendimiento académico de tus grupos y exporta planillas oficiales en PDF y Excel.' }}
          </p>
        </div>

        @if (!isEstudiante() && selectedGroupId()) {
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="exportPdf()"
              [disabled]="isExporting()"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              <span>Exportar PDF</span>
            </button>

            <button
              type="button"
              (click)="exportExcel()"
              [disabled]="isExporting()"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>Exportar Excel</span>
            </button>
          </div>
        }
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

        <!-- VISTA ESTUDIANTE -->
        @if (isEstudiante()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="p-6 rounded-2xl border border-border bg-surface space-y-2">
              <span class="text-xs font-semibold text-text-muted uppercase tracking-wider">Promedio General</span>
              <div class="flex items-baseline gap-2">
                <span class="text-4xl font-black font-mono" [ngClass]="getNotaColor(myGrades()?.promedio_general || 0)">
                  {{ (myGrades()?.promedio_general || 0) | number:'1.1-1' }}
                </span>
                <span class="text-xs text-text-muted font-mono">/ 100</span>
              </div>
              <p class="text-[11px] text-text-muted">Rendimiento ponderado en tus materias</p>
            </div>

            <div class="p-6 rounded-2xl border border-border bg-surface space-y-2">
              <span class="text-xs font-semibold text-text-muted uppercase tracking-wider">EduCoins Ganados por Mérito</span>
              <div class="flex items-baseline gap-2">
                <span class="text-4xl font-black font-mono text-amber-500">
                  +{{ myGrades()?.total_educoins_ganados || 0 }}
                </span>
                <span class="text-xs font-bold text-amber-500/80">EC</span>
              </div>
              <p class="text-[11px] text-text-muted">Acreditados directamente por tus evaluaciones</p>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="font-bold text-base text-slate-900 dark:text-neutral-100">Desglose de Calificaciones</h3>
            <div class="rounded-2xl border border-border bg-surface overflow-hidden">
              <table class="w-full text-xs text-left">
                <thead class="bg-bg border-b border-border text-text-muted font-semibold">
                  <tr>
                    <th class="p-3.5">Actividad</th>
                    <th class="p-3.5 font-mono text-center">Calificación</th>
                    <th class="p-3.5 font-mono text-right">Recompensa</th>
                    <th class="p-3.5 text-right hidden sm:table-cell">Fecha</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  @for (g of myGrades()?.calificaciones || []; track g.id) {
                    <tr class="hover:bg-bg/40 transition-colors">
                      <td class="p-3.5">
                        <span class="font-semibold text-text block">{{ g.activity_nombre || 'Actividad #' + g.activity }}</span>
                        @if (g.comentarios) {
                          <span class="text-[11px] text-text-muted block mt-0.5 italic">"{{ g.comentarios }}"</span>
                        }
                      </td>
                      <td class="p-3.5 text-center">
                        <span class="font-mono font-black text-sm px-2.5 py-1 rounded-lg" [ngClass]="getNotaBadge(g.nota)">
                          {{ g.nota }}
                        </span>
                      </td>
                      <td class="p-3.5 font-mono font-bold text-amber-500 text-right">
                        +{{ g.coins_ganados || 0 }} EC
                      </td>
                      <td class="p-3.5 text-text-muted text-right hidden sm:table-cell">
                        {{ formatDate(g.creado) }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="p-8 text-center text-text-muted">
                        Aún no tienes calificaciones registradas en este periodo.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        } @else {
          <!-- VISTA DOCENTE / RECTOR -->
          <div class="p-4 rounded-2xl border border-border bg-surface flex flex-wrap items-center gap-4">
            <div class="flex-1 min-w-[200px]">
              <label class="block text-xs font-semibold text-text-muted mb-1">Asignatura</label>
              <select
                [ngModel]="selectedClassroomId()"
                (ngModelChange)="onClassroomSelect($event)"
                class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-xs font-medium text-text focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option [ngValue]="null">Selecciona una asignatura</option>
                @for (c of classrooms(); track c.id) {
                  <option [ngValue]="c.id">{{ c.nombre }}</option>
                }
              </select>
            </div>

            <div class="flex-1 min-w-[200px]">
              <label class="block text-xs font-semibold text-text-muted mb-1">Grupo</label>
              <select
                [ngModel]="selectedGroupId()"
                (ngModelChange)="onGroupSelect($event)"
                class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-xs font-medium text-text focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option [ngValue]="null">Selecciona un grupo</option>
                @for (g of filteredGroups(); track g.id) {
                  <option [ngValue]="g.id">{{ g.nombre }} ({{ g.codigo }})</option>
                }
              </select>
            </div>
          </div>

          @if (!selectedGroupId()) {
            <div class="p-12 text-center rounded-2xl border border-dashed border-border bg-surface/50 text-xs text-text-muted">
              Selecciona una asignatura y un grupo escolar para ver la planilla de notas y habilitar la exportación en PDF y Excel.
            </div>
          } @else if (groupReport()) {
            <div class="rounded-2xl border border-border bg-surface overflow-hidden">
              <table class="w-full text-xs text-left">
                <thead class="bg-bg border-b border-border text-text-muted font-semibold">
                  <tr>
                    <th class="p-3.5">Estudiante</th>
                    <th class="p-3.5">Actividad</th>
                    <th class="p-3.5 font-mono text-center">Nota</th>
                    <th class="p-3.5 font-mono text-right">EduCoins</th>
                    <th class="p-3.5 text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  @for (row of groupReport()?.calificaciones || []; track row.id) {
                    <tr class="hover:bg-bg/40 transition-colors">
                      <td class="p-3.5 font-medium text-text">{{ row.estudiante_nombre || row.estudiante_email }}</td>
                      <td class="p-3.5 text-text-muted">{{ row.activity_nombre || 'Actividad #' + row.activity }}</td>
                      <td class="p-3.5 text-center">
                        <span class="font-mono font-bold px-2 py-0.5 rounded" [ngClass]="getNotaBadge(row.nota)">{{ row.nota }}</span>
                      </td>
                      <td class="p-3.5 font-mono font-bold text-amber-500 text-right">+{{ row.coins_ganados }} EC</td>
                      <td class="p-3.5 text-text-muted text-right">{{ formatDate(row.creado) }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="p-8 text-center text-text-muted">
                        No hay notas registradas para este grupo todavía.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      }
    </div>
  `
})
export class GradesComponent implements OnInit {
  private gradeService = inject(GradeService);
  private classroomService = inject(ClassroomService);
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private notifService = inject(NotificationService);

  userRole = computed(() => this.authService.currentUser()?.role || 'estudiante');
  isEstudiante = computed(() => this.userRole() === 'estudiante');

  myGrades = signal<MyGradesResponse | null>(null);
  classrooms = signal<Classroom[]>([]);
  groups = signal<Group[]>([]);
  groupReport = signal<any>(null);

  selectedClassroomId = signal<number | null>(null);
  selectedGroupId = signal<number | null>(null);

  isLoading = signal(false);
  isExporting = signal(false);

  filteredGroups = computed(() => {
    const cid = this.selectedClassroomId();
    if (!cid) return this.groups();
    return this.groups().filter(g => g.classroom === cid);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    if (this.isEstudiante()) {
      this.gradeService.getMyGrades().subscribe({
        next: (res) => {
          this.myGrades.set(res);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    } else {
      this.classroomService.getClassrooms().subscribe({
        next: (c) => this.classrooms.set(c || [])
      });
      this.groupService.getGroups().subscribe({
        next: (g) => {
          this.groups.set(g || []);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    }
  }

  onClassroomSelect(id: number | null): void {
    this.selectedClassroomId.set(id);
    this.selectedGroupId.set(null);
    this.groupReport.set(null);
  }

  onGroupSelect(id: number | null): void {
    this.selectedGroupId.set(id);
    if (id) {
      this.isLoading.set(true);
      this.gradeService.getGroupReport(id).subscribe({
        next: (rep) => {
          this.groupReport.set(rep);
          this.isLoading.set(false);
        },
        error: () => {
          this.groupReport.set(null);
          this.isLoading.set(false);
        }
      });
    } else {
      this.groupReport.set(null);
    }
  }

  exportPdf(): void {
    const gid = this.selectedGroupId();
    if (!gid) return;
    this.isExporting.set(true);
    this.gradeService.exportGroupPdf(gid).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `calificaciones_grupo_${gid}.pdf`);
        this.isExporting.set(false);
        this.notifService.success('Planilla en PDF descargada.');
      },
      error: () => {
        this.isExporting.set(false);
        this.notifService.error('Error al exportar PDF.');
      }
    });
  }

  exportExcel(): void {
    const gid = this.selectedGroupId();
    if (!gid) return;
    this.isExporting.set(true);
    this.gradeService.exportGroupExcel(gid).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `calificaciones_grupo_${gid}.xlsx`);
        this.isExporting.set(false);
        this.notifService.success('Planilla en Excel descargada.');
      },
      error: () => {
        this.isExporting.set(false);
        this.notifService.error('Error al exportar Excel.');
      }
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  getNotaColor(nota: number): string {
    if (nota >= 80) return 'text-emerald-500';
    if (nota >= 60) return 'text-amber-500';
    return 'text-red-500';
  }

  getNotaBadge(nota: number): string {
    if (nota >= 80) return 'bg-emerald-500/10 text-emerald-500';
    if (nota >= 60) return 'bg-amber-500/10 text-amber-500';
    return 'bg-red-500/10 text-red-500';
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}
