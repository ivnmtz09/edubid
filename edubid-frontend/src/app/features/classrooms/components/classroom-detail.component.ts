import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ClassroomService, Classroom, ClassroomGroup } from '../../../core/services/classroom.service';
import { GroupService, Group, GroupStudent } from '../../../core/services/group.service';
import { ActivityService, Activity } from '../../../core/services/activity.service';
import { GradeService } from '../../../core/services/grade.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-classroom-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      <!-- Breadcrumb y Volver -->
      <div class="flex items-center gap-2 text-xs text-text-muted">
        <a routerLink="/classrooms" class="hover:text-text transition-colors">Mis Clases</a>
        <span>/</span>
        <span class="font-bold text-slate-900 dark:text-white truncate">
          {{ classroom()?.nombre || 'Detalle de Clase' }}
        </span>
      </div>

      <!-- Estado de Carga -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-20">
          <svg class="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      } @else if (classroom()) {
        <!-- Encabezado de la Clase -->
        <div class="p-6 sm:p-8 rounded-3xl border border-border bg-surface relative overflow-hidden shadow-xs">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="space-y-2 max-w-2xl">
              <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Asignatura Académica</span>
              </div>
              <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {{ classroom()?.nombre }}
              </h1>
              @if (classroom()?.descripcion) {
                <p class="text-sm text-text-muted leading-relaxed">
                  {{ classroom()?.descripcion }}
                </p>
              }
              <div class="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-2">
                <span class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Docente: {{ classroom()?.docente_nombre || 'Docente' }}</span>
                </span>
                <span>•</span>
                <span class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{{ classroom()?.estudiantes_count || 0 }} estudiantes totales</span>
                </span>
              </div>
            </div>

            @if (canManage()) {
              <div class="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  (click)="openCreateGroupModal()"
                  class="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>+ Nuevo Grupo</span>
                </button>
              </div>
            }
          </div>
        </div>

        <!-- SECCIÓN: GRUPOS DE ESTA CLASE -->
        <section class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h2 class="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Grupos de esta Clase</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-text-muted">
                  {{ groups().length }}
                </span>
              </h2>
              <p class="text-xs text-text-muted mt-0.5">
                Crea grupos (ej: Décimo A, Décimo B), comparte su código de 6 caracteres y asigna actividades.
              </p>
            </div>
          </div>

          @if (groups().length === 0) {
            <!-- Estado Vacío de Grupos -->
            <div class="p-8 sm:p-12 rounded-3xl border border-dashed border-border bg-surface/50 text-center max-w-xl mx-auto space-y-4">
              <div class="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Sin grupos en esta clase todavía</h3>
                <p class="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                  Agrega los grupos de estudiantes que cursarán esta asignatura para generar sus códigos de vinculación.
                </p>
              </div>
              @if (canManage()) {
                <div>
                  <button
                    type="button"
                    (click)="openCreateGroupModal()"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Crear Primer Grupo</span>
                  </button>
                </div>
              }
            </div>
          } @else {
            <!-- Cuadrícula Responsiva de Grupos -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (group of groups(); track group.id) {
                <div class="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-all hover:shadow-md">
                  <div>
                    <!-- Encabezado del Grupo -->
                    <div class="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                          Grupo Activo
                        </span>
                        <h3 class="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                          {{ group.nombre }}
                        </h3>
                      </div>

                      @if (canManage()) {
                        <div class="flex items-center gap-1">
                          <button
                            type="button"
                            (click)="openEditGroupModal(group)"
                            class="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Editar grupo"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            (click)="confirmDeleteGroup(group)"
                            class="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Eliminar grupo"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      }
                    </div>

                    @if (group.descripcion) {
                      <p class="text-xs text-text-muted leading-relaxed line-clamp-2 mb-4">
                        {{ group.descripcion }}
                      </p>
                    }

                    <!-- Cuadro del Código de Vinculación -->
                    <div class="p-3.5 rounded-xl bg-bg border border-border space-y-2">
                      <div class="flex items-center justify-between text-[11px] text-text-muted">
                        <span class="font-semibold uppercase tracking-wider">Código de Vinculación</span>
                        <span class="text-[10px]">6 caracteres</span>
                      </div>
                      <div class="flex items-center justify-between gap-2">
                        <span class="font-mono text-xl font-bold tracking-widest text-primary bg-surface px-3 py-1.5 rounded-lg border border-border/80">
                          {{ group.codigo }}
                        </span>
                        <button
                          type="button"
                          (click)="copyCode(group.codigo)"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted hover:text-text transition-all cursor-pointer shadow-2xs"
                          title="Copiar código"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          <span>{{ copiedCode() === group.codigo ? '¡Copiado!' : 'Copiar' }}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Footer del Grupo con botones de Actividades y Alumnos -->
                  <div class="mt-5 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2">
                    <span class="text-xs text-text-muted flex items-center gap-1.5">
                      <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{{ group.estudiantes_count || 0 }} inscritos</span>
                    </span>

                    <div class="flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="exportGroupReport(group.id, 'pdf')"
                        [disabled]="isExportingReport()"
                        class="p-1.5 text-text-muted hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer disabled:opacity-50"
                        title="Exportar Reporte PDF (Notas y EduCoins)"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        (click)="exportGroupReport(group.id, 'excel')"
                        [disabled]="isExportingReport()"
                        class="p-1.5 text-text-muted hover:text-emerald-500 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer disabled:opacity-50"
                        title="Exportar Reporte Excel (.xlsx)"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        (click)="openActivitiesModal(group)"
                        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 transition-colors cursor-pointer"
                        title="Ver y crear actividades"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>Actividades</span>
                      </button>

                      <button
                        type="button"
                        (click)="openStudentsModal(group)"
                        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors cursor-pointer"
                      >
                        <span>Alumnos</span>
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </section>
      }

      <!-- MODAL: CREAR / EDITAR GRUPO -->
      @if (showGroupModal()) {
        <div
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div class="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-4 sm:p-5 border-b border-border">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  {{ isEditingGroup() ? 'Editar Grupo' : 'Crear Nuevo Grupo' }}
                </h3>
              </div>
              <button
                type="button"
                (click)="closeGroupModal()"
                class="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Cerrar modal"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Body -->
            <form [formGroup]="groupForm" (ngSubmit)="onGroupSubmit()" class="p-4 sm:p-6 space-y-4">
              <div>
                <label for="group-name" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Nombre del Grupo *
                </label>
                <input
                  id="group-name"
                  type="text"
                  formControlName="nombre"
                  placeholder="Ej: Décimo A, Grupo 10-01, etc."
                  class="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted"
                />
                @if (groupForm.get('nombre')?.touched && groupForm.get('nombre')?.hasError('required')) {
                  <p class="text-red-500 text-xs mt-1">El nombre del grupo es obligatorio</p>
                }
              </div>

              <div>
                <label for="group-desc" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Descripción (Opcional)
                </label>
                <textarea
                  id="group-desc"
                  rows="3"
                  formControlName="descripcion"
                  placeholder="Horario, jornada, observaciones..."
                  class="w-full px-4 py-2 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted leading-relaxed"
                ></textarea>
              </div>

              <div class="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <svg class="w-4 h-4 shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>El sistema generará automáticamente un código único para que los alumnos se unan.</span>
              </div>

              <!-- Modal Footer -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  (click)="closeGroupModal()"
                  class="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="groupForm.invalid || isSavingGroup()"
                  class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  @if (isSavingGroup()) {
                    <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Guardando...</span>
                  } @else {
                    <span>{{ isEditingGroup() ? 'Actualizar Grupo' : 'Crear Grupo' }}</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: ACTIVIDADES DEL GRUPO -->
      @if (selectedGroupForActivities()) {
        <div
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div class="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-4 sm:p-5 border-b border-border">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </span>
                <div>
                  <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Actividades: {{ selectedGroupForActivities()?.nombre }}
                  </h3>
                  <p class="text-xs text-text-muted">
                    Asigna retos, proyectos y evaluaciones con recompensas de EduCoins y XP.
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                @if (selectedGroupForActivities()) {
                  <button
                    type="button"
                    (click)="exportGroupReport(selectedGroupForActivities()!.id, 'pdf')"
                    [disabled]="isExportingReport()"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 text-red-600 hover:bg-red-500/20 transition cursor-pointer disabled:opacity-50"
                    title="Descargar reporte académico en PDF"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    (click)="exportGroupReport(selectedGroupForActivities()!.id, 'excel')"
                    [disabled]="isExportingReport()"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                    title="Descargar reporte académico en Excel"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Excel</span>
                  </button>
                }
                @if (canManage()) {
                  <button
                    type="button"
                    (click)="openCreateActivityForm()"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-2xs transition cursor-pointer"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>+ Nueva Actividad</span>
                  </button>
                }
                <button
                  type="button"
                  (click)="closeActivitiesModal()"
                  class="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Modal Body (Lista de Actividades) -->
            <div class="p-4 sm:p-6 overflow-y-auto space-y-4">
              @if (isLoadingActivities()) {
                <div class="flex justify-center py-10">
                  <svg class="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </div>
              } @else if (groupActivities().length === 0) {
                <div class="text-center py-8 space-y-2">
                  <div class="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 class="font-bold text-slate-900 dark:text-white text-sm">No hay actividades creadas en este grupo</h4>
                  <p class="text-xs text-text-muted max-w-sm mx-auto">
                    Publica retos, misiones o proyectos para que los alumnos ganen EduCoins y suban de nivel.
                  </p>
                </div>
              } @else {
                <div class="space-y-3">
                  @for (act of groupActivities(); track act.id) {
                    <div class="p-4 rounded-xl border border-border bg-bg/50 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors space-y-2">
                      <div class="flex items-start justify-between gap-3">
                        <div class="space-y-1">
                          <div class="flex items-center gap-2">
                            <span
                              class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md"
                              [class.bg-blue-500/10]="act.tipo === 'reto'"
                              [class.text-blue-600]="act.tipo === 'reto'"
                              [class.bg-purple-500/10]="act.tipo === 'mision'"
                              [class.text-purple-600]="act.tipo === 'mision'"
                              [class.bg-emerald-500/10]="act.tipo === 'proyecto'"
                              [class.text-emerald-600]="act.tipo === 'proyecto'"
                              [class.bg-amber-500/10]="act.tipo === 'evaluacion'"
                              [class.text-amber-600]="act.tipo === 'evaluacion'"
                            >
                              {{ act.tipo }}
                            </span>
                            <span class="text-xs font-mono text-text-muted">
                              Vence: {{ formatDate(act.fecha_entrega) }}
                            </span>
                          </div>
                          <h4 class="font-bold text-sm text-slate-900 dark:text-white">
                            {{ act.nombre }}
                          </h4>
                          @if (act.descripcion) {
                            <p class="text-xs text-text-muted line-clamp-2">
                              {{ act.descripcion }}
                            </p>
                          }
                        </div>

                        <div class="text-right shrink-0">
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600">
                            +{{ act.valor_educoins }} EC
                          </span>
                          <span class="block text-[11px] font-mono text-text-muted mt-0.5">
                            +{{ act.puntos_experiencia }} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Modal Footer -->
            <div class="p-4 border-t border-border flex justify-end bg-bg/50">
              <button
                type="button"
                (click)="closeActivitiesModal()"
                class="px-4 py-2 rounded-xl text-xs font-semibold bg-surface border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: CREAR NUEVA ACTIVIDAD -->
      @if (showCreateActivityModal()) {
        <div
          class="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div class="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-4 sm:p-5 border-b border-border">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                <div>
                  <h3 class="text-base font-bold text-slate-900 dark:text-white">
                    Nueva Actividad Pedagógica
                  </h3>
                  <p class="text-xs text-text-muted">
                    Para el grupo {{ selectedGroupForActivities()?.nombre }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                (click)="closeCreateActivityForm()"
                class="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Form -->
            <div class="p-4 sm:p-6 space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="act-tipo" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                    Tipo de Actividad *
                  </label>
                  <select
                    id="act-tipo"
                    [(ngModel)]="activityTipo"
                    class="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="reto">Reto formativo</option>
                    <option value="mision">Misión especial</option>
                    <option value="proyecto">Proyecto integrador</option>
                    <option value="evaluacion">Evaluación diagnóstica</option>
                  </select>
                </div>

                <div>
                  <label for="act-deadline" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                    Fecha Límite *
                  </label>
                  <input
                    id="act-deadline"
                    type="datetime-local"
                    [(ngModel)]="activityFechaEntrega"
                    class="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label for="act-name" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Nombre de la Actividad *
                </label>
                <input
                  id="act-name"
                  type="text"
                  [(ngModel)]="activityNombre"
                  placeholder="Ej: Reto 1 - Análisis de Algoritmos"
                  class="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted"
                />
              </div>

              <div>
                <label for="act-desc" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Instrucciones y Criterios (Opcional)
                </label>
                <textarea
                  id="act-desc"
                  rows="3"
                  [(ngModel)]="activityDescripcion"
                  placeholder="Describe la consigna, recursos requeridos o directrices de entrega..."
                  class="w-full px-4 py-2 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted leading-relaxed"
                ></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="act-coins" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                    Recompensa Máx (EC) *
                  </label>
                  <input
                    id="act-coins"
                    type="number"
                    min="1"
                    [(ngModel)]="activityEducoins"
                    class="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label for="act-xp" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                    Puntos de Exp (XP) *
                  </label>
                  <input
                    id="act-xp"
                    type="number"
                    min="1"
                    [(ngModel)]="activityXP"
                    class="w-full px-3 py-2 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  (click)="closeCreateActivityForm()"
                  class="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  (click)="onSubmitCreateActivity()"
                  [disabled]="isSavingActivity() || !activityNombre().trim() || !activityFechaEntrega()"
                  class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  @if (isSavingActivity()) {
                    <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Creando...</span>
                  } @else {
                    <span>Publicar Actividad</span>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: LISTA DE ESTUDIANTES DEL GRUPO -->
      @if (selectedGroupForStudents()) {
        <div
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div class="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-4 sm:p-5 border-b border-border">
              <div>
                <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Estudiantes: {{ selectedGroupForStudents()?.nombre }}
                </h3>
                <p class="text-xs text-text-muted">
                  Código de vinculación: <span class="font-mono font-bold text-primary">{{ selectedGroupForStudents()?.codigo }}</span>
                </p>
              </div>
              <div class="flex items-center gap-2">
                @if (selectedGroupForStudents()) {
                  <button
                    type="button"
                    (click)="exportGroupReport(selectedGroupForStudents()!.id, 'pdf')"
                    [disabled]="isExportingReport()"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                    title="Descargar reporte académico en PDF"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    (click)="exportGroupReport(selectedGroupForStudents()!.id, 'excel')"
                    [disabled]="isExportingReport()"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors cursor-pointer disabled:opacity-50"
                    title="Descargar reporte académico en Excel"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Excel</span>
                  </button>
                }
                <button
                  type="button"
                  (click)="selectedGroupForStudents.set(null)"
                  class="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Cerrar modal"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Modal Body (List of Students) -->
            <div class="p-4 sm:p-6 overflow-y-auto space-y-4">
              @if (isLoadingStudents()) {
                <div class="flex justify-center py-10">
                  <svg class="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </div>
              } @else if (groupStudents().length === 0) {
                <div class="text-center py-8 space-y-2">
                  <div class="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 class="font-bold text-slate-900 dark:text-white text-sm">No hay estudiantes vinculados aún</h4>
                  <p class="text-xs text-text-muted max-w-sm mx-auto">
                    Comparte el código <span class="font-mono font-bold text-primary">{{ selectedGroupForStudents()?.codigo }}</span> con tus alumnos para que se unan a través de su portal.
                  </p>
                </div>
              } @else {
                <div class="space-y-2">
                  @for (student of groupStudents(); track student.id) {
                    <div class="flex items-center justify-between p-3 rounded-xl border border-border bg-bg/50 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-9 h-9 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {{ (student.first_name?.[0] || 'E') }}{{ (student.last_name?.[0] || '') }}
                        </div>
                        <div class="min-w-0">
                          <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {{ student.first_name }} {{ student.last_name }}
                          </p>
                          <p class="text-xs text-text-muted truncate font-mono">
                            {{ student.email }}
                          </p>
                        </div>
                      </div>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
                        Inscrito
                      </span>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Modal Footer -->
            <div class="p-4 border-t border-border flex justify-end bg-bg/50">
              <button
                type="button"
                (click)="selectedGroupForStudents.set(null)"
                class="px-4 py-2 rounded-xl text-xs font-semibold bg-surface border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: CONFIRMAR ELIMINACIÓN DE GRUPO -->
      @if (groupToDelete()) {
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
                ¿Eliminar el grupo "{{ groupToDelete()?.nombre }}"?
              </h3>
              <p class="text-xs text-text-muted mt-2 leading-relaxed">
                Esta acción desvinculará a los estudiantes inscritos en este grupo. Los datos del grupo se perderán permanentemente.
              </p>
            </div>
            <div class="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                (click)="groupToDelete.set(null)"
                class="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="onDeleteGroupSubmit()"
                [disabled]="isDeletingGroup()"
                class="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {{ isDeletingGroup() ? 'Eliminando...' : 'Eliminar Grupo' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ClassroomDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private classroomService = inject(ClassroomService);
  private groupService = inject(GroupService);
  private activityService = inject(ActivityService);
  private gradeService = inject(GradeService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  classroomId = signal<number | null>(null);
  classroom = signal<Classroom | null>(null);
  groups = signal<Group[]>([]);
  isLoading = signal(true);
  isExportingReport = signal(false);
  copiedCode = signal<string | null>(null);

  // Modal Crear/Editar Grupo
  showGroupModal = signal(false);
  isEditingGroup = signal(false);
  editingGroupId = signal<number | null>(null);
  isSavingGroup = signal(false);
  isDeletingGroup = signal(false);
  groupToDelete = signal<Group | null>(null);

  // Modal Estudiantes del Grupo
  selectedGroupForStudents = signal<Group | null>(null);
  groupStudents = signal<GroupStudent[]>([]);
  isLoadingStudents = signal(false);

  // Modal Actividades del Grupo
  selectedGroupForActivities = signal<Group | null>(null);
  groupActivities = signal<Activity[]>([]);
  isLoadingActivities = signal(false);

  // Modal Crear Actividad
  showCreateActivityModal = signal(false);
  isSavingActivity = signal(false);
  activityTipo = signal<string>('reto');
  activityNombre = signal<string>('');
  activityDescripcion = signal<string>('');
  activityEducoins = signal<number>(100);
  activityXP = signal<number>(10);
  activityFechaEntrega = signal<string>('');

  groupForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    descripcion: [''],
  });

  userRole = computed(() => this.authService.currentUser()?.role || 'estudiante');
  canManage = computed(() => ['docente', 'admin'].includes(this.userRole()));

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.classroomId.set(+id);
        this.loadClassroomDetail(+id);
      }
    });
  }

  loadClassroomDetail(id: number): void {
    this.isLoading.set(true);
    this.classroomService.getClassroom(id).subscribe({
      next: (data) => {
        this.classroom.set(data);
        this.loadGroupsForClassroom(id);
      },
      error: (err) => {
        console.error('Error cargando clase:', err);
        this.notificationService.error('No se pudo cargar la información de la clase');
        this.isLoading.set(false);
      },
    });
  }

  loadGroupsForClassroom(classroomId: number): void {
    this.groupService.getGroups().subscribe({
      next: (allGroups) => {
        const classGroups = allGroups.filter((g) => g.classroom === classroomId);
        this.groups.set(classGroups);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando grupos:', err);
        this.isLoading.set(false);
      },
    });
  }

  copyCode(code: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.copiedCode.set(code);
        this.notificationService.success(`Código ${code} copiado al portapapeles`);
        setTimeout(() => this.copiedCode.set(null), 2500);
      });
    }
  }

  openCreateGroupModal(): void {
    this.isEditingGroup.set(false);
    this.editingGroupId.set(null);
    this.groupForm.reset({ nombre: '', descripcion: '' });
    this.showGroupModal.set(true);
  }

  openEditGroupModal(g: Group): void {
    this.isEditingGroup.set(true);
    this.editingGroupId.set(g.id);
    this.groupForm.patchValue({
      nombre: g.nombre,
      descripcion: g.descripcion || '',
    });
    this.showGroupModal.set(true);
  }

  closeGroupModal(): void {
    this.showGroupModal.set(false);
    this.isEditingGroup.set(false);
    this.editingGroupId.set(null);
  }

  onGroupSubmit(): void {
    if (this.groupForm.invalid || !this.classroomId() || this.isSavingGroup()) return;

    this.isSavingGroup.set(true);
    const formValue = this.groupForm.value;

    if (this.isEditingGroup() && this.editingGroupId()) {
      this.groupService.updateGroup(this.editingGroupId()!, formValue).subscribe({
        next: () => {
          this.isSavingGroup.set(false);
          this.closeGroupModal();
          this.notificationService.success('Grupo actualizado correctamente');
          this.loadClassroomDetail(this.classroomId()!);
        },
        error: (err) => {
          this.isSavingGroup.set(false);
          this.notificationService.error(err.error?.detail || 'Error al actualizar el grupo');
        },
      });
    } else {
      this.groupService
        .createGroup({
          nombre: formValue.nombre,
          classroom: this.classroomId()!,
          descripcion: formValue.descripcion,
        })
        .subscribe({
          next: () => {
            this.isSavingGroup.set(false);
            this.closeGroupModal();
            this.notificationService.success('Grupo creado con su código de vinculación');
            this.loadClassroomDetail(this.classroomId()!);
          },
          error: (err) => {
            this.isSavingGroup.set(false);
            this.notificationService.error(err.error?.detail || 'Error al crear el grupo');
          },
        });
    }
  }

  confirmDeleteGroup(group: Group): void {
    this.groupToDelete.set(group);
  }

  onDeleteGroupSubmit(): void {
    const g = this.groupToDelete();
    if (!g || this.isDeletingGroup()) return;

    this.isDeletingGroup.set(true);
    this.groupService.deleteGroup(g.id).subscribe({
      next: () => {
        this.isDeletingGroup.set(false);
        this.groupToDelete.set(null);
        this.notificationService.success(`Grupo "${g.nombre}" eliminado`);
        if (this.classroomId()) {
          this.loadClassroomDetail(this.classroomId()!);
        }
      },
      error: (err) => {
        this.isDeletingGroup.set(false);
        this.groupToDelete.set(null);
        this.notificationService.error(err.error?.detail || 'Error al eliminar el grupo');
      },
    });
  }

  openStudentsModal(group: Group): void {
    this.selectedGroupForStudents.set(group);
    this.isLoadingStudents.set(true);
    this.groupService.getGroupStudents(group.id).subscribe({
      next: (students) => {
        this.groupStudents.set(students || []);
        this.isLoadingStudents.set(false);
      },
      error: (err) => {
        console.error('Error cargando estudiantes:', err);
        this.groupStudents.set([]);
        this.isLoadingStudents.set(false);
      },
    });
  }

  // ================= GESTIÓN DE ACTIVIDADES =================

  openActivitiesModal(group: Group): void {
    this.selectedGroupForActivities.set(group);
    this.loadGroupActivities(group.id);
  }

  closeActivitiesModal(): void {
    this.selectedGroupForActivities.set(null);
    this.showCreateActivityModal.set(false);
  }

  loadGroupActivities(groupId: number): void {
    this.isLoadingActivities.set(true);
    this.activityService.getActivities(groupId).subscribe({
      next: (acts) => {
        this.groupActivities.set(acts || []);
        this.isLoadingActivities.set(false);
      },
      error: (err) => {
        console.error('Error cargando actividades:', err);
        this.groupActivities.set([]);
        this.isLoadingActivities.set(false);
      },
    });
  }

  openCreateActivityForm(): void {
    this.activityTipo.set('reto');
    this.activityNombre.set('');
    this.activityDescripcion.set('');
    this.activityEducoins.set(100);
    this.activityXP.set(10);

    const inAWeek = new Date();
    inAWeek.setDate(inAWeek.getDate() + 7);
    inAWeek.setMinutes(inAWeek.getMinutes() - inAWeek.getTimezoneOffset());
    this.activityFechaEntrega.set(inAWeek.toISOString().slice(0, 16));

    this.showCreateActivityModal.set(true);
  }

  closeCreateActivityForm(): void {
    this.showCreateActivityModal.set(false);
  }

  onSubmitCreateActivity(): void {
    if (this.isSavingActivity()) return;
    const grp = this.selectedGroupForActivities();
    if (!grp || !this.activityNombre().trim() || !this.activityFechaEntrega()) {
      this.notificationService.error('Ingresa el nombre y fecha de entrega de la actividad.');
      return;
    }

    this.isSavingActivity.set(true);
    const payload = {
      group: grp.id,
      tipo: this.activityTipo(),
      nombre: this.activityNombre().trim(),
      descripcion: this.activityDescripcion().trim(),
      valor_educoins: this.activityEducoins(),
      puntos_experiencia: this.activityXP(),
      fecha_entrega: new Date(this.activityFechaEntrega()).toISOString(),
      habilitada: true,
    };

    this.activityService.createActivity(payload).subscribe({
      next: (created) => {
        this.isSavingActivity.set(false);
        this.showCreateActivityModal.set(false);
        this.notificationService.success(`Actividad "${created.nombre}" creada con éxito.`);
        this.loadGroupActivities(grp.id);
      },
      error: (err) => {
        this.isSavingActivity.set(false);
        const msg = err.error?.detail || 'Error al crear la actividad';
        this.notificationService.error(msg);
      },
    });
  }

  exportGroupReport(groupId: number, format: 'pdf' | 'excel'): void {
    this.isExportingReport.set(true);
    const obs$ = format === 'pdf'
      ? this.gradeService.exportGroupPdf(groupId)
      : this.gradeService.exportGroupExcel(groupId);

    obs$.subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_grupo_${groupId}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.isExportingReport.set(false);
        this.notificationService.success(`Reporte del grupo descargado en ${format.toUpperCase()} correctamente.`);
      },
      error: (err) => {
        console.error('Error al exportar reporte de grupo:', err);
        this.isExportingReport.set(false);
        this.notificationService.error('Error al generar el reporte del grupo.');
      }
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }
}
