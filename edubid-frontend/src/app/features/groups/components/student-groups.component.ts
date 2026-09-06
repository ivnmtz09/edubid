import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { GroupService, Group } from '../../../core/services/group.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-student-groups',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      <!-- Encabezado de la página -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface border border-border text-text-muted mb-2">
            <span>Portal del Estudiante</span>
            <span>•</span>
            <span class="font-mono text-slate-900 dark:text-white">Mis Grupos</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Mis Grupos de Clase
          </h1>
          <p class="text-sm text-text-muted mt-1">
            Consulta los grupos a los que estás vinculado, accede a tus asignaturas y únete a nuevos grupos con código.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="openJoinModal()"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Unirse a un Grupo</span>
          </button>
        </div>
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
        <!-- Lista de Grupos del Estudiante -->
        @if (groups().length === 0) {
          <!-- Estado Vacío -->
          <div class="p-8 sm:p-12 rounded-3xl border border-border bg-surface text-center max-w-2xl mx-auto space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto shadow-inner">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">Aún no estás en ningún grupo</h3>
              <p class="text-sm text-text-muted mt-1.5 max-w-md mx-auto">
                Para comenzar a participar en actividades, acumular EduCoins y pujar en subastas, solicita el código de 6 caracteres a tu docente.
              </p>
            </div>
            <div class="pt-2">
              <button
                type="button"
                (click)="openJoinModal()"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span>Ingresar Código de Acceso</span>
              </button>
            </div>
          </div>
        } @else {
          <!-- Cuadrícula Responsiva de Grupos -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (group of groups(); track group.id) {
              <div class="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-all hover:shadow-md group">
                <div>
                  <!-- Encabezado de la Tarjeta del Grupo -->
                  <div class="flex items-start justify-between gap-3 mb-3">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>{{ group.classroom_nombre || group.classroom_detail?.nombre || 'Clase' }}</span>
                    </span>

                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                      Activo
                    </span>
                  </div>

                  <!-- Nombre del Grupo -->
                  <h3 class="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {{ group.nombre }}
                  </h3>

                  @if (group.descripcion) {
                    <p class="text-xs text-text-muted mt-2 line-clamp-2 leading-relaxed">
                      {{ group.descripcion }}
                    </p>
                  }

                  <!-- Estadísticas del Grupo -->
                  <div class="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
                    <span class="flex items-center gap-1.5">
                      <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{{ group.estudiantes_count }} compañeros</span>
                    </span>

                    <span class="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-text-muted">
                      Cód: {{ group.codigo }}
                    </span>
                  </div>
                </div>

                <!-- Botones de Acción -->
                <div class="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <a
                    routerLink="/dashboard"
                    class="w-full text-center py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors cursor-pointer"
                  >
                    Ver Actividades y Notas
                  </a>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- MODAL: UNIRSE A UN GRUPO POR CÓDIGO -->
      @if (showJoinModal()) {
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </span>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  Unirse a un Grupo
                </h3>
              </div>
              <button
                type="button"
                (click)="closeJoinModal()"
                class="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Cerrar modal"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Body -->
            <form [formGroup]="joinForm" (ngSubmit)="onJoinSubmit()" class="p-4 sm:p-6 space-y-4">
              <div>
                <label for="group-code" class="block text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Código de Acceso del Grupo
                </label>
                <input
                  id="group-code"
                  type="text"
                  formControlName="code"
                  placeholder="EJ: B7X9Q2"
                  maxlength="10"
                  class="w-full text-center text-xl sm:text-2xl font-mono tracking-widest uppercase px-4 py-3 border-2 border-border rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 bg-bg text-slate-900 dark:text-white transition-all outline-none"
                />
                <p class="text-xs text-text-muted mt-2 text-center">
                  Ingresa el código único de 6 caracteres que te dio tu profesor.
                </p>
              </div>

              <div class="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-900 dark:text-orange-200 flex items-center gap-2.5">
                <svg class="w-4 h-4 shrink-0 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Al unirte, tu billetera de EduCoins se activará para este periodo.</span>
              </div>

              <!-- Modal Footer -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  (click)="closeJoinModal()"
                  class="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="joinForm.invalid || isJoining()"
                  class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  @if (isJoining()) {
                    <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Vinculando...</span>
                  } @else {
                    <span>Unirme al Grupo</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class StudentGroupsComponent implements OnInit {
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  groups = signal<Group[]>([]);
  isLoading = signal(true);
  isJoining = signal(false);
  showJoinModal = signal(false);

  joinForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(4)]],
  });

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.isLoading.set(true);
    this.groupService.getGroups().subscribe({
      next: (data) => {
        this.groups.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar grupos:', err);
        this.notificationService.error('No se pudieron cargar tus grupos de clase');
        this.isLoading.set(false);
      },
    });
  }

  openJoinModal(): void {
    this.joinForm.reset();
    this.showJoinModal.set(true);
  }

  closeJoinModal(): void {
    this.showJoinModal.set(false);
  }

  onJoinSubmit(): void {
    if (this.joinForm.invalid) return;

    this.isJoining.set(true);
    const code = this.joinForm.value.code;

    this.groupService.joinGroup(code).subscribe({
      next: (res) => {
        this.isJoining.set(false);
        this.closeJoinModal();
        this.notificationService.success(
          res.mensaje || '¡Te has unido exitosamente al grupo!',
          'Vinculación Exitosa'
        );
        if (res.wallet_creada) {
          this.notificationService.info(
            'Tu billetera de EduCoins ha sido activada para el periodo actual.',
            'Billetera Activada'
          );
        }
        this.loadGroups();
      },
      error: (err) => {
        this.isJoining.set(false);
        const errorMsg = err.error?.detail || err.error?.message || 'Código inválido o expirado';
        this.notificationService.error(errorMsg, 'Error al unirse');
      },
    });
  }
}
