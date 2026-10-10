import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ActivityService, Activity, Submission } from '../../core/services/activity.service';
import { ClassroomService, Classroom } from '../../core/services/classroom.service';
import { GroupService, Group } from '../../core/services/group.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AiAssistantService } from '../../core/services/ai-assistant.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { EmptyStateComponent } from '../../shared/components/ui/empty-state.component';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, EmptyStateComponent],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      
      <!-- ==================== VISTA DETALLADA COMPLETA IN-PAGE ==================== -->
      @if (selectedActivity()) {
        <div class="space-y-6">
          <!-- Barra Superior / Breadcrumb de Retorno -->
          <div class="flex items-center justify-between gap-4 border-b border-border pb-4">
            <button
              type="button"
              (click)="backToList()"
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Volver a la lista de actividades</span>
            </button>

            <div class="flex items-center gap-2 text-xs font-mono text-text-muted">
              <span>ID: #{{ selectedActivity()?.id }}</span>
            </div>
          </div>

          <!-- Cabecera Principal de la Actividad -->
          <div class="p-6 sm:p-8 rounded-3xl border border-border bg-surface space-y-6 shadow-xs">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div class="space-y-3 flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full" [ngClass]="getTipoBadge(selectedActivity()!.tipo)">
                    {{ selectedActivity()!.tipo }}
                  </span>

                  <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-border" [ngClass]="isVencida(selectedActivity()!.fecha_entrega) ? 'text-red-500' : 'text-emerald-500'">
                    {{ isVencida(selectedActivity()!.fecha_entrega) ? 'Plazo Vencido' : getTimeRemaining(selectedActivity()!.fecha_entrega) }}
                  </span>

                  @if (selectedActivity()?.group_nombre) {
                    <span class="text-xs text-text-muted font-medium">
                      Grupo: <strong class="text-text">{{ selectedActivity()?.group_nombre }}</strong>
                    </span>
                  }
                </div>

                <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight leading-tight">
                  {{ selectedActivity()!.nombre }}
                </h1>

                <div class="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-1">
                  <span class="flex items-center gap-1 font-mono">
                    <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Límite: {{ formatDate(selectedActivity()!.fecha_entrega) }}</span>
                  </span>
                  <span>•</span>
                  <span>Creado: {{ formatDate(selectedActivity()?.creado) }}</span>
                </div>
              </div>

              <!-- Recompensas Destacadas -->
              <div class="flex sm:flex-col gap-3 shrink-0">
                <div class="p-4 rounded-2xl bg-bg border border-border flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm">
                    <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Recompensa</span>
                    <span class="text-lg font-black font-mono text-amber-500">+{{ selectedActivity()!.valor_educoins }} EC</span>
                  </div>
                </div>

                <div class="p-4 rounded-2xl bg-bg border border-border flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Calificación Base</span>
                    <span class="text-lg font-black font-mono text-primary">{{ selectedActivity()!.puntos_experiencia }} pts</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Instrucciones Detalladas -->
            <div class="pt-6 border-t border-border space-y-3">
              <h3 class="text-xs font-bold text-text-muted uppercase tracking-wider">
                Instrucciones y Requisitos de la Actividad
              </h3>
              <div class="p-5 rounded-2xl bg-bg border border-border text-sm text-text leading-relaxed whitespace-pre-line">
                {{ selectedActivity()!.descripcion || 'El docente no ha especificado instrucciones adicionales para esta actividad.' }}
              </div>
            </div>
          </div>

          <!-- ==================== SECCIÓN PARA ESTUDIANTES (ENTREGA Y ESTADO) ==================== -->
          @if (!isDocente()) {
            <div class="p-6 sm:p-8 rounded-3xl border border-border bg-surface space-y-6">
              <div class="flex items-center justify-between border-b border-border pb-4">
                <h3 class="font-bold text-lg text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                  <span>Mi Entrega</span>
                  @if (mySubmission()) {
                    @if (mySubmission()?.calificacion !== null && mySubmission()?.calificacion !== undefined) {
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Calificada ({{ mySubmission()?.calificacion }}/100)
                      </span>
                    } @else {
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        Entregada (En revisión)
                      </span>
                    }
                  } @else {
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-text-muted border border-border">
                      Pendiente de entrega
                    </span>
                  }
                </h3>
              </div>

              <!-- Si ya entregó -->
              @if (mySubmission()) {
                <div class="space-y-4">
                  <!-- Tarjeta de Calificación y Feedback si ya fue calificada -->
                  @if (mySubmission()?.calificacion !== null && mySubmission()?.calificacion !== undefined) {
                    <div class="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Evaluación del Docente
                        </span>
                        <span class="text-xl font-black font-mono text-emerald-500">
                          {{ mySubmission()?.calificacion }}/100
                        </span>
                      </div>
                      <p class="text-xs text-text leading-relaxed">
                        {{ mySubmission()?.retroalimentacion || '¡Buen trabajo! Actividad evaluada satisfactoriamente.' }}
                      </p>
                      <div class="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                        EduCoins acreditados en tu billetera.
                      </div>
                    </div>
                  }

                  <!-- Detalle de lo que envió -->
                  <div class="p-5 rounded-2xl bg-bg border border-border space-y-3 text-xs">
                    <div class="flex items-center justify-between text-text-muted">
                      <span>Fecha de envío:</span>
                      <span class="font-mono text-text font-medium">{{ formatDate(mySubmission()!.creado) }}</span>
                    </div>

                    @if (mySubmission()?.contenido) {
                      <div>
                        <span class="font-bold text-text-muted block mb-1">Respuesta enviada:</span>
                        <div class="p-3 rounded-xl bg-surface border border-border text-text whitespace-pre-line">
                          {{ mySubmission()!.contenido }}
                        </div>
                      </div>
                    }

                    @if (mySubmission()?.archivo) {
                      <div class="pt-2">
                        <span class="font-bold text-text-muted block mb-1">Archivo adjunto:</span>
                        <a
                          [href]="mySubmission()!.archivo"
                          target="_blank"
                          class="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border text-primary hover:underline font-semibold"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Descargar archivo adjunto</span>
                        </a>
                      </div>
                    }

                    <!-- Opción de anular entrega si no está calificada y no está vencida -->
                    @if ((mySubmission()?.calificacion === null || mySubmission()?.calificacion === undefined) && !isVencida(selectedActivity()!.fecha_entrega)) {
                      <div class="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div class="space-y-0.5">
                          <p class="font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-1.5">
                            <svg class="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            ¿Te equivocaste de archivo o desarrollo?
                          </p>
                          <p class="text-[11px] text-text-muted">
                            Puedes anular esta entrega para subir una nueva versión antes del vencimiento.
                          </p>
                        </div>

                        <button
                          type="button"
                          (click)="cancelMySubmission()"
                          [disabled]="isSaving()"
                          class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-surface hover:bg-rose-500/10 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                          title="Anular entrega actual para volver a subir"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Anular Entrega</span>
                        </button>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <!-- Formulario In-Page para Enviar la Tarea -->
                @if (isVencida(selectedActivity()!.fecha_entrega)) {
                  <div class="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 text-center space-y-2">
                    <p class="text-sm font-bold text-red-500">El plazo límite para esta actividad ha concluido.</p>
                    <p class="text-xs text-text-muted">No es posible registrar nuevas entregas para actividades vencidas.</p>
                  </div>
                } @else {
                  <form (ngSubmit)="submitWorkInPage()" class="space-y-4 text-xs">
                    <div>
                      <label class="block font-semibold text-text-muted mb-1.5">Tu Respuesta o Desarrollo Escrito</label>
                      <textarea
                        rows="4"
                        [(ngModel)]="submitContenido"
                        name="submitContenido"
                        placeholder="Escribe tu desarrollo, enlace a documento en la nube o explicación..."
                        class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none resize-none leading-relaxed"
                      ></textarea>
                    </div>

                    <div>
                      <label class="block font-semibold text-text-muted mb-1.5">Archivo Adjunto (Opcional)</label>
                      <input
                        type="file"
                        (change)="onFileSelected($event)"
                        class="w-full text-text-muted file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                      />
                    </div>

                    <div class="flex justify-end pt-3">
                      <button
                        type="submit"
                        [disabled]="(!submitContenido && !selectedFile) || isSaving()"
                        class="px-6 py-2.5 rounded-xl text-white bg-primary hover:bg-primary-hover disabled:opacity-50 cursor-pointer font-semibold shadow-xs transition-all hover:scale-[1.02]"
                      >
                        {{ isSaving() ? 'Enviando Entrega...' : 'Registrar Entrega Oficial' }}
                      </button>
                    </div>
                  </form>
                }
              }
            </div>
          }

          <!-- ==================== SECCIÓN PARA DOCENTES (TABLA DE ENTREGAS Y CALIFICACIÓN) ==================== -->
          @if (isDocente()) {
            <div class="p-6 sm:p-8 rounded-3xl border border-border bg-surface space-y-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h3 class="font-bold text-lg text-slate-900 dark:text-neutral-100">
                    Entregas de Estudiantes
                  </h3>
                  <p class="text-xs text-text-muted mt-0.5">
                    {{ submissions().length }} entrega(s) registrada(s) para esta actividad.
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="deleteActivity(selectedActivity()!)"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-colors cursor-pointer"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Eliminar Actividad</span>
                  </button>
                </div>
              </div>

              <!-- Tabla de Entregas -->
              <div class="rounded-2xl border border-border bg-surface overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full text-xs text-left">
                    <thead class="bg-bg border-b border-border text-text-muted font-semibold">
                      <tr>
                        <th class="p-3.5">Estudiante</th>
                        <th class="p-3.5">Fecha de Entrega</th>
                        <th class="p-3.5">Respuesta / Archivo</th>
                        <th class="p-3.5 font-mono text-center">Calificación</th>
                        <th class="p-3.5 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-border">
                      @for (sub of submissions(); track sub.id) {
                        <tr class="hover:bg-neutral-500/5 transition-colors">
                          <td class="p-3.5 font-medium text-text">
                            <div>
                              <p class="font-bold">{{ sub.estudiante_nombre || 'Estudiante' }}</p>
                              <p class="text-[11px] text-text-muted font-normal">{{ sub.estudiante_email }}</p>
                            </div>
                          </td>
                          <td class="p-3.5 text-text-muted font-mono">{{ formatDate(sub.creado) }}</td>
                          <td class="p-3.5 text-text-muted">
                            <div class="max-w-xs space-y-1">
                              @if (sub.contenido) {
                                <p class="text-text line-clamp-1">{{ sub.contenido }}</p>
                              }
                              @if (sub.archivo) {
                                <a [href]="sub.archivo" target="_blank" class="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold">
                                  <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                                  <span>Ver archivo adjunto</span>
                                </a>
                              }
                            </div>
                          </td>
                          <td class="p-3.5 text-center font-mono font-bold">
                            @if (sub.calificacion !== null && sub.calificacion !== undefined) {
                              <span class="text-emerald-500">{{ sub.calificacion }}/100</span>
                            } @else {
                              <span class="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-text-muted text-[10px] font-normal border border-border">
                                Pendiente
                              </span>
                            }
                          </td>
                          <td class="p-3.5 text-center">
                            <button
                              type="button"
                              (click)="openGradeModal(sub)"
                              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                            >
                              <span>{{ sub.calificacion !== null && sub.calificacion !== undefined ? 'Re-calificar' : 'Calificar' }}</span>
                            </button>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="5" class="p-8 text-center text-text-muted">
                            No hay entregas registradas para esta actividad todavía.
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {

        <!-- ==================== VISTA LISTA / GRID DE ACTIVIDADES ==================== -->
        <!-- Encabezado de la página -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface border border-border text-text-muted mb-2">
              <span>{{ isDocente() ? 'Gestión Pedagógica' : 'Mis Tareas' }}</span>
              <span>•</span>
              <span class="font-mono text-slate-900 dark:text-neutral-100">Actividades</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
              {{ isDocente() ? 'Actividades' : 'Mis Actividades' }}
            </h1>
            <p class="text-sm text-text-muted mt-1">
              {{ isDocente() 
                ? 'Publica actividades, revisa entregas y califica para acreditar EduCoins a tus estudiantes.' 
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
                <span>Nueva Actividad</span>
              </button>
            </div>
          }
        </div>

        <!-- Filtros para Docente (Cascada: Asignatura -> Grupo) -->
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

        <!-- Estado de Carga: Skeleton Screen con Shimmer -->
        @if (isLoading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            @for (i of [1, 2, 3, 4, 5, 6]; track i) {
              <div class="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
                <div class="flex items-center justify-between">
                  <div class="h-5 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
                  <div class="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
                </div>
                <div class="h-6 w-4/5 bg-neutral-200 dark:bg-neutral-800 rounded-lg"></div>
                <div class="h-10 w-full bg-neutral-100 dark:bg-neutral-800/60 rounded-lg"></div>
                <div class="pt-3 border-t border-border flex justify-between">
                  <div class="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                  <div class="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- Grid de Actividades -->
          @if (activities().length === 0) {
            <app-empty-state
              icon="activity"
              [title]="'No hay actividades disponibles'"
              [description]="isDocente() 
                ? 'Crea tu primera actividad para que tus estudiantes empiecen a ganar EduCoins y participar.' 
                : 'Estás al día con tus entregas académicas. ¡Buen trabajo!'"
              [actionLabel]="isDocente() ? 'Crear Primera Actividad' : undefined"
              (actionClick)="openCreateModal()"
            ></app-empty-state>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (act of activities(); track act.id) {
                <div
                  (click)="selectActivity(act)"
                  class="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between hover:border-primary/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg space-y-4 cursor-pointer group"
                >
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                      <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full" [ngClass]="getTipoBadge(act.tipo)">
                        {{ act.tipo }}
                      </span>

                      <span class="text-xs font-mono font-bold" [ngClass]="isVencida(act.fecha_entrega) ? 'text-red-500' : 'text-emerald-500'">
                        {{ getTimeRemaining(act.fecha_entrega) }}
                      </span>
                    </div>

                    <h3 class="text-base font-bold text-slate-900 dark:text-neutral-100 line-clamp-1 group-hover:text-primary transition-colors">
                      {{ act.nombre }}
                    </h3>

                    @if (act.descripcion) {
                      <p class="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">
                        {{ act.descripcion }}
                      </p>
                    }

                    <div class="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                      <span class="flex items-center gap-1 font-bold text-amber-500">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        +{{ act.valor_educoins }} EC
                      </span>
                      <span class="text-text-muted">
                        Nota: {{ act.puntos_experiencia }} pts
                      </span>
                    </div>
                  </div>

                  <!-- Botón de apertura rápida de la vista in-page -->
                  <div class="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <button
                      type="button"
                      (click)="selectActivity(act); $event.stopPropagation()"
                      class="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-bg hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{{ isDocente() ? 'Ver Detalle & Entregas' : 'Ver Instrucciones & Entregar' }}</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
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

              <div>
                <label class="block font-semibold text-text-muted mb-1">Tipo de Actividad *</label>
                <select formControlName="tipo" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none">
                  <option value="tarea">Tarea</option>
                  <option value="proyecto">Proyecto</option>
                  <option value="evaluacion">Evaluación</option>
                  <option value="examen">Examen</option>
                </select>
              </div>

              <!-- Plazo Máximo de Entrega (Fecha + Hora en intervalos de 30m) -->
              <div class="p-4 rounded-2xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-border space-y-3">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-text uppercase tracking-wider">
                    Plazo Máximo de Entrega *
                  </label>
                  <span class="text-[11px] text-text-muted font-medium">Intervalos de 30 minutos</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Fecha (Día) -->
                  <div>
                    <label class="block text-[11px] font-semibold text-text-muted mb-1">Día límite *</label>
                    <input
                      type="date"
                      formControlName="fecha_entrega_date"
                      class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none text-xs sm:text-sm cursor-pointer"
                    />
                  </div>

                  <!-- Hora límite en intervalos de 30 minutos -->
                  <div>
                    <label class="block text-[11px] font-semibold text-text-muted mb-1">Hora límite *</label>
                    <select
                      formControlName="fecha_entrega_time"
                      class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none text-xs sm:text-sm cursor-pointer font-mono"
                    >
                      @for (opt of timeIntervalOptions; track opt.value) {
                        <option [value]="opt.value">{{ opt.label }}</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Botones de atajo rápido de hora -->
                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                  <span class="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-1">Rápido:</span>
                  @for (preset of quickTimePresets; track preset.value) {
                    <button
                      type="button"
                      (click)="setActivityDueTime(preset.value)"
                      class="px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer"
                      [ngClass]="activityForm.get('fecha_entrega_time')?.value === preset.value
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text border-border'"
                    >
                      {{ preset.label }}
                    </button>
                  }
                </div>
              </div>

              <div>
                <label class="block font-semibold text-text-muted mb-1">Nombre de la Actividad *</label>
                <input type="text" formControlName="nombre" placeholder="Ej: Taller Práctico de Genética" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none" />
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
                  <label class="block font-semibold text-text-muted mb-1">Nota / Puntos base *</label>
                  <input type="number" formControlName="puntos_experiencia" min="1" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none font-mono" />
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" (click)="closeCreateModal()" class="px-4 py-2 rounded-xl border border-border hover:bg-bg text-text-muted cursor-pointer font-semibold">Cancelar</button>
                <button type="submit" [disabled]="activityForm.invalid || isSaving()" class="px-5 py-2 rounded-xl text-white bg-primary hover:bg-primary-hover disabled:opacity-50 cursor-pointer font-semibold transition-colors">
                  {{ isSaving() ? 'Guardando...' : 'Publicar Actividad' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL CALIFICAR SUBMISSION (DOCENTE) -->
      @if (showGradeModal()) {
        <div class="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" (click)="showGradeModal.set(false)">
          <div class="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl p-5 space-y-4" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between border-b border-border pb-2">
              <h3 class="font-bold text-sm text-text">Calificar Entrega</h3>
              <button type="button" (click)="showGradeModal.set(false)" class="p-1 rounded-lg text-text-muted hover:text-text cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <p class="text-xs text-text-muted">Estudiante: <strong class="text-text">{{ selectedSubmission()?.estudiante_nombre || selectedSubmission()?.estudiante_email }}</strong></p>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-semibold text-text-muted mb-1">Nota (0 a 100) *</label>
                <input type="number" min="0" max="100" [(ngModel)]="gradeNota" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
              <div>
                <label class="block font-semibold text-text-muted mb-1">Retroalimentación / Comentario</label>
                <textarea rows="2" [(ngModel)]="gradeComentario" placeholder="Comentarios del docente..." class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none resize-none"></textarea>
              </div>
              <div class="flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" (click)="showGradeModal.set(false)" class="px-3 py-1.5 rounded-xl border border-border hover:bg-bg text-text-muted cursor-pointer font-semibold">Cancelar</button>
                <button type="button" (click)="submitGrade()" [disabled]="isSaving()" class="px-4 py-1.5 rounded-xl text-white bg-primary hover:bg-primary-hover cursor-pointer font-semibold transition-colors">Guardar y Acreditar</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ActivitiesComponent implements OnInit, OnDestroy {
  private activityService = inject(ActivityService);
  private classroomService = inject(ClassroomService);
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private notifService = inject(NotificationService);
  private aiService = inject(AiAssistantService);
  private confirmService = inject(ConfirmDialogService);
  private fb = inject(FormBuilder);
  private aiSub?: Subscription;

  userRole = computed(() => this.authService.currentUser()?.role || 'estudiante');
  isDocente = computed(() => ['docente', 'admin', 'rector', 'coordinador'].includes(this.userRole()));

  activities = signal<Activity[]>([]);
  classrooms = signal<Classroom[]>([]);
  groups = signal<Group[]>([]);
  submissions = signal<Submission[]>([]);

  selectedClassroomId = signal<number | null>(null);
  selectedGroupId = signal<number | null>(null);

  // Estado para Vista In-Page Detallada
  selectedActivity = signal<Activity | null>(null);
  mySubmission = signal<Submission | null>(null);

  isLoading = signal(false);
  isSaving = signal(false);
  showCreateModal = signal(false);
  showGradeModal = signal(false);

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

  readonly timeIntervalOptions = [
    { value: '06:00', label: '06:00 AM' },
    { value: '06:30', label: '06:30 AM' },
    { value: '07:00', label: '07:00 AM' },
    { value: '07:30', label: '07:30 AM' },
    { value: '08:00', label: '08:00 AM (Inicio jornada)' },
    { value: '08:30', label: '08:30 AM' },
    { value: '09:00', label: '09:00 AM' },
    { value: '09:30', label: '09:30 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '10:30', label: '10:30 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '11:30', label: '11:30 AM' },
    { value: '12:00', label: '12:00 PM (Mediodía)' },
    { value: '12:30', label: '12:30 PM' },
    { value: '13:00', label: '01:00 PM' },
    { value: '13:30', label: '01:30 PM' },
    { value: '14:00', label: '02:00 PM' },
    { value: '14:30', label: '02:30 PM' },
    { value: '15:00', label: '03:00 PM' },
    { value: '15:30', label: '03:30 PM' },
    { value: '16:00', label: '04:00 PM' },
    { value: '16:30', label: '04:30 PM' },
    { value: '17:00', label: '05:00 PM' },
    { value: '17:30', label: '05:30 PM' },
    { value: '18:00', label: '06:00 PM (Fin de la tarde)' },
    { value: '18:30', label: '06:30 PM' },
    { value: '19:00', label: '07:00 PM' },
    { value: '19:30', label: '07:30 PM' },
    { value: '20:00', label: '08:00 PM' },
    { value: '20:30', label: '08:30 PM' },
    { value: '21:00', label: '09:00 PM' },
    { value: '21:30', label: '09:30 PM' },
    { value: '22:00', label: '10:00 PM' },
    { value: '22:30', label: '10:30 PM' },
    { value: '23:00', label: '11:00 PM' },
    { value: '23:30', label: '11:30 PM' },
    { value: '23:59', label: '11:59 PM (Fin del día)' },
  ];

  readonly quickTimePresets = [
    { value: '23:59', label: '23:59 (Fin de día)' },
    { value: '18:00', label: '18:00 (Tarde)' },
    { value: '12:00', label: '12:00 (Mediodía)' },
    { value: '08:00', label: '08:00 (Mañana)' },
  ];

  setActivityDueTime(time: string): void {
    this.activityForm.patchValue({ fecha_entrega_time: time });
  }

  activityForm: FormGroup = this.fb.group({
    group: ['', Validators.required],
    tipo: ['tarea', Validators.required],
    nombre: ['', Validators.required],
    descripcion: [''],
    fecha_entrega_date: ['', Validators.required],
    fecha_entrega_time: ['23:59', Validators.required],
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
    this.initAiSync();
  }

  ngOnDestroy(): void {
    this.aiSub?.unsubscribe();
  }

  private initAiSync(): void {
    this.aiSub = this.aiService.actionCompleted$.subscribe((event) => {
      const isActEvent = event.tools.some((t) =>
        t.includes('activity') || t.includes('grade') || t.includes('submission')
      );
      if (isActEvent) {
        this.loadActivities();
        this.notifService.info(
          'Actividades actualizadas automáticamente por EDUBID IA.',
          'EDUBID IA'
        );
      }
    });
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

  selectActivity(act: Activity): void {
    this.selectedActivity.set(act);
    this.submitContenido = '';
    this.selectedFile = null;
    this.loadActivityDetails(act.id);
  }

  backToList(): void {
    this.selectedActivity.set(null);
    this.submissions.set([]);
    this.mySubmission.set(null);
  }

  loadActivityDetails(activityId: number): void {
    this.activityService.getSubmissions(activityId).subscribe({
      next: (subs: Submission[]) => {
        const list = subs || [];
        this.submissions.set(list);

        if (!this.isDocente()) {
          // Para estudiante: buscar su propia entrega
          const currentUserId = this.authService.currentUser()?.id;
          const userSub = list.find(s => s.estudiante === currentUserId) || list[0] || null;
          this.mySubmission.set(userSub);
        }
      },
      error: () => {
        this.submissions.set([]);
        this.mySubmission.set(null);
      }
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
    const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    this.activityForm.reset({
      group: this.selectedGroupId() || '',
      tipo: 'tarea',
      nombre: '',
      descripcion: '',
      fecha_entrega_date: inAWeek.toISOString().slice(0, 10),
      fecha_entrega_time: '23:59',
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
    const datePart = val.fecha_entrega_date;
    const timePart = val.fecha_entrega_time || '23:59';
    const isoDateTime = new Date(`${datePart}T${timePart}:00`).toISOString();

    const payload = {
      group: Number(val.group),
      tipo: val.tipo,
      nombre: val.nombre,
      descripcion: val.descripcion,
      valor_educoins: val.valor_educoins,
      puntos_experiencia: val.puntos_experiencia,
      fecha_entrega: isoDateTime,
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

  async cancelMySubmission(): Promise<void> {
    const sub = this.mySubmission();
    if (!sub) return;

    const confirmed = await this.confirmService.confirm({
      title: 'Anular Entrega de Actividad',
      message: '¿Estás seguro de anular esta entrega? Se eliminará el envío actual para que puedas corregir tu respuesta o subir un archivo nuevo antes del plazo límite.',
      confirmText: 'Anular Entrega',
      cancelText: 'Volver',
      type: 'warning',
      icon: 'trash',
    });
    if (!confirmed) return;

    this.isSaving.set(true);
    this.activityService.cancelSubmission(sub.id).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.mySubmission.set(null);
        this.submitContenido = '';
        this.selectedFile = null;
        this.notifService.success('Entrega anulada. Ya puedes subir una nueva versión.');
        if (this.selectedActivity()) {
          this.loadActivityDetails(this.selectedActivity()!.id);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        const msg = err?.error?.detail || err?.error?.error || 'No se pudo anular la entrega.';
        this.notifService.error(msg);
      }
    });
  }

  async deleteActivity(act: Activity): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar Actividad Pedagógica',
      message: `¿Deseas eliminar la actividad "${act.nombre}"? Esta acción no se puede deshacer y eliminará las entregas asociadas.`,
      confirmText: 'Eliminar Definitivamente',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'trash',
    });
    if (!confirmed) return;

    this.activityService.deleteActivity(act.id).subscribe({
      next: () => {
        this.notifService.success('Actividad eliminada.');
        if (this.selectedActivity()?.id === act.id) {
          this.backToList();
        }
        this.loadActivities();
      },
      error: () => this.notifService.error('Error al eliminar la actividad.')
    });
  }

  openGradeModal(sub: Submission): void {
    this.selectedSubmission.set(sub);
    this.gradeNota = sub.calificacion !== null && sub.calificacion !== undefined ? Number(sub.calificacion) : 100;
    this.gradeComentario = sub.retroalimentacion || '';
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
        this.notifService.success(`¡Calificado con éxito! +${res.coins_ganados || 0} EduCoins acreditados.`);
        if (this.selectedActivity()) {
          this.loadActivityDetails(this.selectedActivity()!.id);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notifService.error(err.error?.detail || 'Error al calificar.');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  submitWorkInPage(): void {
    const act = this.selectedActivity();
    if (!act || this.isSaving()) return;
    this.isSaving.set(true);
    const fd = new FormData();
    fd.append('activity', String(act.id));
    if (this.submitContenido) fd.append('contenido', this.submitContenido);
    if (this.selectedFile) fd.append('archivo', this.selectedFile);

    this.activityService.submitActivity(fd).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.notifService.success('¡Actividad entregada con éxito!');
        this.loadActivityDetails(act.id);
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
      tarea: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      proyecto: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
      evaluacion: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      examen: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
    };
    return map[tipo] || 'bg-neutral-100 text-text-muted border border-border';
  }

  getTimeRemaining(fecha: string): string {
    const diff = new Date(fecha).getTime() - Date.now();
    if (diff <= 0) return 'Vencida';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h restantes`;
    if (h > 0) return `${h}h ${m}m restantes`;
    return `${m}m restantes`;
  }

  isVencida(fecha: string): boolean {
    return new Date(fecha).getTime() < Date.now();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }
}
