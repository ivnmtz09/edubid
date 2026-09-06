import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ClassroomService, Classroom, ClassroomGroup } from '../../../core/services/classroom.service';
import { GroupService, Group, GroupStudent } from '../../../core/services/group.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-classroom-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
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
                Crea grupos (ej: Décimo A, Décimo B) y comparte su código único de 6 caracteres con tus estudiantes.
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
                            class="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Editar grupo"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            (click)="confirmDeleteGroup(group)"
                            class="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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

                  <!-- Footer del Grupo con botón para ver Estudiantes -->
                  <div class="mt-5 pt-4 border-t border-border flex items-center justify-between gap-2">
                    <span class="text-xs text-text-muted flex items-center gap-1.5">
                      <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{{ group.estudiantes_count || 0 }} inscritos</span>
                    </span>

                    <button
                      type="button"
                      (click)="openStudentsModal(group)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors cursor-pointer"
                    >
                      <span>Ver Alumnos</span>
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
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
                class="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors cursor-pointer"
              >
                Eliminar Grupo
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
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  classroomId = signal<number | null>(null);
  classroom = signal<Classroom | null>(null);
  groups = signal<Group[]>([]);
  isLoading = signal(true);
  copiedCode = signal<string | null>(null);

  // Modal Crear/Editar Grupo
  showGroupModal = signal(false);
  isEditingGroup = signal(false);
  editingGroupId = signal<number | null>(null);
  isSavingGroup = signal(false);
  groupToDelete = signal<Group | null>(null);

  // Modal Estudiantes del Grupo
  selectedGroupForStudents = signal<Group | null>(null);
  groupStudents = signal<GroupStudent[]>([]);
  isLoadingStudents = signal(false);

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
        // Cargar grupos de esta clase
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
    if (this.groupForm.invalid || !this.classroomId()) return;

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
      this.groupService.createGroup({
        nombre: formValue.nombre,
        classroom: this.classroomId()!,
        descripcion: formValue.descripcion,
      }).subscribe({
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
    if (!g) return;

    this.groupService.deleteGroup(g.id).subscribe({
      next: () => {
        this.groupToDelete.set(null);
        this.notificationService.success(`Grupo "${g.nombre}" eliminado`);
        if (this.classroomId()) {
          this.loadClassroomDetail(this.classroomId()!);
        }
      },
      error: (err) => {
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
}
