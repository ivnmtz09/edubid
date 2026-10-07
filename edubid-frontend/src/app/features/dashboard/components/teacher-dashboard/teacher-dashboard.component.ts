import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ClassroomService, Classroom } from '../../../../core/services/classroom.service';
import { ActivityService, Submission } from '../../../../core/services/activity.service';
import { AuctionService, Auction } from '../../../../core/services/auction.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { AiAssistantService } from '../../../../core/services/ai-assistant.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-all duration-200 hover:scale-[1.02] cursor-pointer"
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
                <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
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
                  <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Subastas Pedagógicas
                  </h2>
                </div>
                <button
                  type="button"
                  (click)="openCreateAuctionModal()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Programar Subasta</span>
                </button>
              </div>

              @if (teacherAuctions().length === 0) {
                <div class="p-6 rounded-xl border border-border bg-surface text-center text-xs text-text-muted">
                  No has programado subastas pedagógicas en este momento.
                </div>
              } @else {
                <div class="space-y-3">
                  @for (a of teacherAuctions(); track a.id) {
                    <div class="p-4 rounded-xl border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                      <div class="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                        <div class="text-right">
                          <span class="text-xs font-mono font-bold text-slate-900 dark:text-white block">
                            {{ a.total_pujas }} pujas
                          </span>
                          <span
                            class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            [class.bg-emerald-500/10]="a.estado === 'active'"
                            [class.text-emerald-600]="a.estado === 'active'"
                            [class.bg-slate-500/10]="a.estado === 'closed'"
                            [class.text-slate-500]="a.estado === 'closed'"
                          >
                            {{ a.estado === 'active' ? 'En Curso' : 'Cerrada' }}
                          </span>
                        </div>

                        @if (a.estado === 'active') {
                          <button
                            type="button"
                            (click)="closeAuction(a)"
                            [disabled]="closingAuctionId() === a.id"
                            class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 dark:text-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            title="Finalizar subasta y cobrar al ganador"
                          >
                            {{ closingAuctionId() === a.id ? 'Cerrando...' : 'Cerrar' }}
                          </button>
                        }
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
                          Entrega #{{ rev.id }} • {{ formatDate(rev.creado) }}
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
                        (click)="openGradeModal(rev)"
                        class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-2xs transition-all cursor-pointer"
                      >
                        Revisar y Calificar
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- MODAL: REVISAR Y CALIFICAR ENTREGA -->
      @if (selectedReview()) {
        <div
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div class="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-4 sm:p-5 border-b border-border">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <h3 class="text-base font-bold text-slate-900 dark:text-white">
                    Calificar Entrega #{{ selectedReview()?.id }}
                  </h3>
                  <p class="text-xs text-text-muted">
                    {{ selectedReview()?.estudiante_nombre }} • {{ selectedReview()?.activity_nombre }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                (click)="closeGradeModal()"
                class="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-4 sm:p-6 space-y-4">
              <!-- Contenido / Comentario del Alumno -->
              <div class="p-3.5 rounded-xl bg-bg border border-border space-y-1">
                <span class="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                  Respuesta o Comentarios del Estudiante
                </span>
                <p class="text-sm text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                  {{ selectedReview()?.contenido || 'Sin texto adjunto en la entrega.' }}
                </p>
                @if (selectedReview()?.archivo) {
                  <div class="pt-2 border-t border-border/60 mt-2">
                    <a
                      [href]="selectedReview()?.archivo"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Descargar Archivo Adjunto</span>
                    </a>
                  </div>
                }
              </div>

              <!-- Formulario de Calificación -->
              <div class="space-y-4 pt-2">
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label for="review-grade" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                      Calificación (0 - 100) *
                    </label>
                    <span class="text-xs font-mono font-bold" [class.text-emerald-600]="reviewGrade() >= 90" [class.text-amber-600]="reviewGrade() >= 70 && reviewGrade() < 90" [class.text-red-500]="reviewGrade() < 70">
                      {{ reviewGrade() }}/100
                    </span>
                  </div>
                  <input
                    id="review-grade"
                    type="number"
                    min="0"
                    max="100"
                    [(ngModel)]="reviewGrade"
                    class="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                  @if (reviewGrade() >= 90) {
                    <p class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                      Excelente desempeño: acredita un 10% adicional de EduCoins.
                    </p>
                  }
                </div>

                <div>
                  <label for="review-feedback" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                    Retroalimentación Pedagógica (Opcional)
                  </label>
                  <textarea
                    id="review-feedback"
                    rows="3"
                    [(ngModel)]="reviewFeedback"
                    placeholder="Excelente trabajo resolviendo la actividad, tus aportes fueron clave..."
                    class="w-full px-4 py-2 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                  ></textarea>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  (click)="closeGradeModal()"
                  class="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  (click)="submitGrade()"
                  [disabled]="isSubmittingGrade() || reviewGrade() < 0 || reviewGrade() > 100"
                  class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  @if (isSubmittingGrade()) {
                    <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Guardando...</span>
                  } @else {
                    <span>Acreditar Recompensa</span>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: PROGRAMAR SUBASTA PEDAGÓGICA -->
      @if (showCreateAuctionModal()) {
        <div
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div class="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-4 sm:p-5 border-b border-border">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  Programar Subasta de Aula
                </h3>
              </div>
              <button
                type="button"
                (click)="closeCreateAuctionModal()"
                class="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-4 sm:p-6 space-y-4">
              <div>
                <label for="auc-title" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Título del Incentivo Pedagógico *
                </label>
                <input
                  id="auc-title"
                  type="text"
                  [(ngModel)]="auctionTitle"
                  placeholder="Ej: +1.0 Punto extra en evaluación final, Escoger equipo..."
                  class="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label for="auc-desc" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Descripción (Opcional)
                </label>
                <textarea
                  id="auc-desc"
                  rows="2"
                  [(ngModel)]="auctionDescription"
                  placeholder="Detalles sobre las condiciones de uso de este incentivo..."
                  class="w-full px-4 py-2 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                ></textarea>
              </div>

              <div>
                <label for="auc-group" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Grupo Destinatario *
                </label>
                <select
                  id="auc-group"
                  [(ngModel)]="auctionGroupId"
                  class="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option [ngValue]="null" disabled selected>Selecciona un grupo de aula</option>
                  @for (grp of teacherGroups(); track grp.id) {
                    <option [ngValue]="grp.id">{{ grp.classroomName }} — {{ grp.nombre }}</option>
                  }
                </select>
                @if (teacherGroups().length === 0) {
                  <p class="text-[11px] text-amber-600 mt-1">Primero crea al menos un grupo dentro de tus clases para publicar subastas.</p>
                }
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="auc-min-coins" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                    Precio Base (EC) *
                  </label>
                  <input
                    id="auc-min-coins"
                    type="number"
                    min="1"
                    [(ngModel)]="auctionMinCoins"
                    class="w-full px-4 py-2 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label for="auc-min-inc" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                    Incremento Mín. (EC) *
                  </label>
                  <input
                    id="auc-min-inc"
                    type="number"
                    min="1"
                    [(ngModel)]="auctionMinIncrement"
                    class="w-full px-4 py-2 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label for="auc-end-date" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                  Fecha y Hora de Cierre *
                </label>
                <input
                  id="auc-end-date"
                  type="datetime-local"
                  [(ngModel)]="auctionEndDate"
                  class="w-full px-4 py-2 text-sm border border-border rounded-xl bg-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                />
              </div>

              <!-- Modal Footer -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  (click)="closeCreateAuctionModal()"
                  class="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  (click)="submitCreateAuction()"
                  [disabled]="isCreatingAuction() || !auctionTitle().trim() || !auctionGroupId() || !auctionEndDate()"
                  class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  @if (isCreatingAuction()) {
                    <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Publicando...</span>
                  } @else {
                    <span>Publicar Subasta</span>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class TeacherDashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private classroomService = inject(ClassroomService);
  private activityService = inject(ActivityService);
  private auctionService = inject(AuctionService);
  private wsService = inject(WebSocketService);
  private aiAssistantService = inject(AiAssistantService);
  private wsSub = new Subscription();

  isLoading = signal<boolean>(true);
  classrooms = signal<Classroom[]>([]);
  pendingReviews = signal<Submission[]>([]);
  teacherAuctions = signal<Auction[]>([]);

  // Modal Calificar
  selectedReview = signal<Submission | null>(null);
  reviewGrade = signal<number>(100);
  reviewFeedback = signal<string>('');
  isSubmittingGrade = signal<boolean>(false);

  // Modal Crear Subasta
  showCreateAuctionModal = signal<boolean>(false);
  isCreatingAuction = signal<boolean>(false);
  auctionTitle = signal<string>('');
  auctionDescription = signal<string>('');
  auctionGroupId = signal<number | null>(null);
  auctionMinCoins = signal<number>(50);
  auctionMinIncrement = signal<number>(10);
  auctionEndDate = signal<string>('');
  closingAuctionId = signal<number | null>(null);

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

  teacherGroups = computed(() => {
    const list: { id: number; nombre: string; classroomName: string }[] = [];
    for (const c of this.classrooms()) {
      if (c.grupos_clases) {
        for (const g of c.grupos_clases) {
          list.push({ id: g.id, nombre: g.nombre, classroomName: c.nombre });
        }
      }
    }
    return list;
  });

  ngOnInit(): void {
    this.loadTeacherData();
    this.initRealTimeListeners();
  }

  ngOnDestroy(): void {
    this.wsSub.unsubscribe();
  }

  private initRealTimeListeners(): void {
    // 1. Escuchar nuevas ofertas en tiempo real
    this.wsSub.add(
      this.wsService.onBidUpdate$().subscribe((bidEvent) => {
        let isMyAuction = false;
        this.teacherAuctions.update((current) =>
          current.map((auc) => {
            if (auc.id === bidEvent.auction_id) {
              isMyAuction = true;
              return {
                ...auc,
                puja_mas_alta: bidEvent.puja_mas_alta,
                total_pujas: bidEvent.total_pujas,
                incremento_minimo_educoins: bidEvent.incremento_minimo_educoins,
              };
            }
            return auc;
          })
        );

        if (isMyAuction) {
          this.notificationService.info(
            `Nueva oferta de ${bidEvent.puja_mas_alta.estudiante_nombre} (${bidEvent.puja_mas_alta.cantidad_educoins} EC) en "${bidEvent.auction_titulo}"`,
            'Subasta en Vivo'
          );
        }
      })
    );

    // 2. Escuchar cierres de subasta en tiempo real
    this.wsSub.add(
      this.wsService.onAuctionClosed$().subscribe((closedEvent) => {
        let closedAuctionTitle = '';
        this.teacherAuctions.update((current) =>
          current.map((auc) => {
            if (auc.id === closedEvent.auction_id) {
              closedAuctionTitle = auc.titulo;
              return {
                ...auc,
                estado: 'closed',
              };
            }
            return auc;
          })
        );

        if (closedAuctionTitle) {
          const winnerMsg = closedEvent.ganador
            ? `Ganador: ${closedEvent.ganador.nombre} (${closedEvent.ganador.monto_pagado} EC)`
            : 'Finalizada sin ofertas.';
          this.notificationService.success(
            `La subasta "${closedAuctionTitle}" ha concluido. ${winnerMsg}`,
            'Subasta Finalizada'
          );
        }
      })
    );

    // 3. Sincronización en vivo con acciones ejecutadas por EDUBID IA
    this.wsSub.add(
      this.aiAssistantService.actionCompleted$.subscribe(() => {
        this.loadTeacherData();
      })
    );
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
        const pending = (subs || []).filter(
          (s) => s.calificacion === null || s.calificacion === undefined
        );
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

  // ================= CALIFICAR ENTREGA =================

  openGradeModal(item: Submission): void {
    this.selectedReview.set(item);
    this.reviewGrade.set(100);
    this.reviewFeedback.set('');
  }

  closeGradeModal(): void {
    this.selectedReview.set(null);
  }

  submitGrade(): void {
    const item = this.selectedReview();
    if (!item || this.isSubmittingGrade()) return;

    const nota = this.reviewGrade();
    if (nota < 0 || nota > 100) {
      this.notificationService.error('La calificación debe estar entre 0 y 100.');
      return;
    }

    this.isSubmittingGrade.set(true);
    this.activityService
      .gradeSubmission(item.id, {
        nota,
        retroalimentacion: this.reviewFeedback().trim(),
      })
      .subscribe({
        next: (res) => {
          this.isSubmittingGrade.set(false);
          this.closeGradeModal();
          this.notificationService.success(
            `Entrega calificada. +${res.coins_ganados} EduCoins acreditados al estudiante.`,
            'Calificación Exitosa'
          );
          // Quitar de la lista de pendientes
          this.pendingReviews.update((list) => list.filter((r) => r.id !== item.id));
        },
        error: (err) => {
          this.isSubmittingGrade.set(false);
          const msg = err.error?.detail || err.error?.error || 'Error al calificar la entrega';
          this.notificationService.error(msg);
        },
      });
  }

  // ================= GESTIÓN DE SUBASTAS =================

  openCreateAuctionModal(): void {
    this.auctionTitle.set('');
    this.auctionDescription.set('');
    this.auctionGroupId.set(this.teacherGroups().length > 0 ? this.teacherGroups()[0].id : null);
    this.auctionMinCoins.set(50);
    this.auctionMinIncrement.set(10);

    // Fecha sugerida: 2 días en el futuro
    const inTwoDays = new Date();
    inTwoDays.setDate(inTwoDays.getDate() + 2);
    inTwoDays.setMinutes(inTwoDays.getMinutes() - inTwoDays.getTimezoneOffset());
    this.auctionEndDate.set(inTwoDays.toISOString().slice(0, 16));

    this.showCreateAuctionModal.set(true);
  }

  closeCreateAuctionModal(): void {
    this.showCreateAuctionModal.set(false);
  }

  submitCreateAuction(): void {
    if (this.isCreatingAuction()) return;

    if (!this.auctionTitle().trim() || !this.auctionGroupId() || !this.auctionEndDate()) {
      this.notificationService.error('Completa los campos obligatorios para la subasta.');
      return;
    }

    this.isCreatingAuction.set(true);
    const payload = {
      titulo: this.auctionTitle().trim(),
      descripcion: this.auctionDescription().trim(),
      grupo: this.auctionGroupId()!,
      valor_minimo_educoins: this.auctionMinCoins(),
      incremento_minimo_educoins: this.auctionMinIncrement(),
      fecha_fin: new Date(this.auctionEndDate()).toISOString(),
    };

    this.auctionService.createAuction(payload).subscribe({
      next: (created) => {
        this.isCreatingAuction.set(false);
        this.closeCreateAuctionModal();
        this.notificationService.success(
          `Subasta "${created.titulo}" publicada correctamente.`,
          'Subasta Creada'
        );
        this.teacherAuctions.update((list) => [created, ...list]);
      },
      error: (err) => {
        this.isCreatingAuction.set(false);
        const msg = err.error?.detail || err.error?.message || 'Error al crear la subasta';
        this.notificationService.error(msg);
      },
    });
  }

  closeAuction(auction: Auction): void {
    if (this.closingAuctionId() !== null) return;

    if (!confirm(`¿Deseas cerrar la subasta "${auction.titulo}" ahora y declarar al ganador?`)) {
      return;
    }

    this.closingAuctionId.set(auction.id);
    this.auctionService.closeAuction(auction.id).subscribe({
      next: (res) => {
        this.closingAuctionId.set(null);
        this.teacherAuctions.update((list) =>
          list.map((a) => (a.id === auction.id ? { ...a, estado: 'closed' } : a))
        );
        const winner = res.ganador
          ? `Ganador: ${res.ganador.nombre} (${res.ganador.monto_pagado} EC)`
          : 'Finalizada sin ofertas.';
        this.notificationService.success(`Subasta cerrada. ${winner}`, 'Subasta Concluida');
      },
      error: (err) => {
        this.closingAuctionId.set(null);
        const msg = err.error?.detail || 'Error al cerrar la subasta';
        this.notificationService.error(msg);
      },
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
