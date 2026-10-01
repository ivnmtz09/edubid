import {
  Component,
  inject,
  signal,
  OnInit,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { InstitutionService, Institution } from '../../../../core/services/institution.service';
import { AUTH_ENDPOINTS } from '../../../../core/constants/api.constants';
import { environment } from '../../../../../environments/environment';

type OnboardingRole = 'estudiante' | 'docente';

interface RoleOption {
  value: OnboardingRole;
  label: string;
  description: string;
  icon: string; // SVG path
}

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-bg">
      <!-- Fondo decorativo -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-60 -right-60 w-[32rem] h-[32rem] rounded-full opacity-[0.04]" style="background: var(--brand-primary);"></div>
        <div class="absolute -bottom-60 -left-60 w-[36rem] h-[36rem] rounded-full opacity-[0.04]" style="background: var(--brand-accent);"></div>
      </div>

      <div class="w-full max-w-2xl relative z-10">

        <!-- Branding / Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border mb-4" style="background: color-mix(in srgb, var(--brand-primary) 10%, transparent); border-color: color-mix(in srgb, var(--brand-primary) 30%, transparent); color: var(--brand-primary);">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Un último paso
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-neutral-100">
            Completa tu perfil en EduBid
          </h1>
          <p class="text-sm text-text-muted mt-2 max-w-md mx-auto leading-relaxed">
            Antes de empezar, cuéntanos un poco más. Esto nos ayuda a personalizar tu experiencia.
          </p>
        </div>

        <!-- Indicador de pasos -->
        <div class="flex items-center gap-3 mb-8 justify-center">
          @for (s of [1, 2]; track s) {
            <div class="flex items-center gap-2">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                [style.background]="currentStep() >= s ? 'var(--brand-primary)' : ''"
                [class.text-white]="currentStep() >= s"
                [class.bg-neutral-200]="currentStep() < s"
                [class.dark:bg-neutral-700]="currentStep() < s"
                [class.text-text-muted]="currentStep() < s"
              >
                @if (currentStep() > s) {
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                } @else {
                  {{ s }}
                }
              </div>
              <span class="text-xs font-medium" [class.text-text-muted]="currentStep() < s" [class.font-semibold]="currentStep() === s">
                {{ s === 1 ? 'Tu rol' : 'Tu institución' }}
              </span>
            </div>
            @if (s < 2) {
              <div class="w-8 h-px flex-shrink-0" [style.background]="currentStep() > 1 ? 'var(--brand-primary)' : 'var(--color-border)'"></div>
            }
          }
        </div>

        <!-- Paso 1: Selección de Rol -->
        @if (currentStep() === 1) {
          <div class="bento-card p-6 sm:p-8">
            <h2 class="text-lg font-bold text-slate-900 dark:text-neutral-100 mb-1">¿Cuál es tu rol en la institución?</h2>
            <p class="text-xs text-text-muted mb-6">Selecciona el rol que mejor te describe. Esto determinará qué funciones tendrás disponibles.</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl mx-auto">
              @for (role of roles; track role.value) {
                <button
                  type="button"
                  (click)="selectedRole.set(role.value)"
                  class="relative p-5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer group"
                  [style.border-color]="selectedRole() === role.value ? 'var(--brand-primary)' : 'var(--color-border)'"
                  [style.background]="selectedRole() === role.value ? 'color-mix(in srgb, var(--brand-primary) 8%, transparent)' : 'var(--color-surface)'"
                >
                  <!-- Check mark -->
                  @if (selectedRole() === role.value) {
                    <div class="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style="background: var(--brand-primary);">
                      <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  }

                  <!-- Icono -->
                  <div class="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" [style.background]="selectedRole() === role.value ? 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' : 'color-mix(in srgb, var(--color-border) 50%, transparent)'">
                    <svg class="w-5 h-5" [style.color]="selectedRole() === role.value ? 'var(--brand-primary)' : 'var(--color-text-muted)'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" [attr.d]="role.icon"/>
                    </svg>
                  </div>

                  <h3 class="font-bold text-sm mb-1" [style.color]="selectedRole() === role.value ? 'var(--brand-primary)' : ''" [class.text-text]="selectedRole() !== role.value">{{ role.label }}</h3>
                  <p class="text-[11px] text-text-muted leading-relaxed">{{ role.description }}</p>
                </button>
              }
            </div>

            <div class="mt-6 flex justify-end">
              <button
                type="button"
                (click)="goToStep2()"
                [disabled]="!selectedRole()"
                class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style="background: var(--brand-primary);"
              >
                Siguiente
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        }

        <!-- Paso 2: Selección de Institución -->
        @if (currentStep() === 2) {
          <div class="bento-card p-6 sm:p-8">
            <h2 class="text-lg font-bold text-slate-900 dark:text-neutral-100 mb-1">¿A qué institución perteneces?</h2>
            <p class="text-xs text-text-muted mb-5">Busca tu colegio o institución educativa en la lista.</p>

            @if (error()) {
              <div class="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs mb-4">
                <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {{ error() }}
              </div>
            }

            <!-- Buscador -->
            <div class="relative mb-4">
              <svg class="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearch()"
                placeholder="Buscar institución..."
                class="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:ring-2 focus:outline-none transition-all"
              />
            </div>

            <!-- Lista de Instituciones -->
            @if (isLoadingInstitutions()) {
              <div class="flex items-center justify-center py-12">
                <svg class="animate-spin h-6 w-6 text-text-muted" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </div>
            } @else if (filteredInstitutions().length === 0) {
              <div class="text-center py-10 text-xs text-text-muted">
                <svg class="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                No se encontraron instituciones con "{{ searchQuery }}"
              </div>
            } @else {
              <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
                @for (inst of filteredInstitutions(); track inst.id) {
                  <button
                    type="button"
                    (click)="selectedInstitution.set(inst)"
                    class="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer"
                    [style.border-color]="selectedInstitution()?.id === inst.id ? 'var(--brand-primary)' : 'var(--color-border)'"
                    [style.background]="selectedInstitution()?.id === inst.id ? 'color-mix(in srgb, var(--brand-primary) 6%, transparent)' : 'var(--color-bg)'"
                  >
                    <!-- Logo o color swatch -->
                    @if (inst.logo) {
                      <img [src]="inst.logo" (error)="$event.target.style.display='none'" [alt]="inst.nombre" class="w-10 h-10 rounded-xl object-contain bg-white border border-border shrink-0"/>
                    } @else {
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-white text-sm" [style.background]="inst.color_primario">
                        {{ inst.nombre.charAt(0).toUpperCase() }}
                      </div>
                    }

                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-sm text-text truncate">{{ inst.nombre }}</p>
                      @if (inst.codigo_dane) {
                        <p class="text-[11px] text-text-muted font-mono">DANE: {{ inst.codigo_dane }}</p>
                      }
                    </div>

                    <!-- Color chips -->
                    <div class="flex gap-1 shrink-0">
                      <span class="w-3.5 h-3.5 rounded-full border border-white/20" [style.background]="inst.color_primario"></span>
                      <span class="w-3.5 h-3.5 rounded-full border border-white/20" [style.background]="inst.color_secundario"></span>
                    </div>

                    @if (selectedInstitution()?.id === inst.id) {
                      <div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style="background: var(--brand-primary);">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    }
                  </button>
                }
              </div>
            }

            <div class="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                (click)="currentStep.set(1)"
                class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted border border-border hover:bg-bg hover:text-text transition-all cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                Volver
              </button>
              <button
                type="button"
                (click)="submit()"
                [disabled]="!selectedInstitution() || isSubmitting()"
                class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style="background: var(--brand-primary);"
              >
                @if (isSubmitting()) {
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Guardando...</span>
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <span>Completar Registro</span>
                }
              </button>
            </div>
          </div>
        }

      </div>
    </div>
  `,
})
export class CompleteProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private institutionService = inject(InstitutionService);
  private router = inject(Router);
  private http = inject(HttpClient);

  currentStep = signal<1 | 2>(1);
  selectedRole = signal<OnboardingRole | null>(null);
  selectedInstitution = signal<Institution | null>(null);
  searchQuery = '';
  allInstitutions = signal<Institution[]>([]);
  filteredInstitutions = signal<Institution[]>([]);
  isLoadingInstitutions = signal(false);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  roles: RoleOption[] = [
    {
      value: 'estudiante',
      label: 'Estudiante',
      description: 'Participo en subastas, gano EduCoins y recibo calificaciones.',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    },
    {
      value: 'docente',
      label: 'Docente',
      description: 'Creo actividades, califico y gestiono subastas para mis grupos.',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    },
  ];

  ngOnInit(): void {
    // Si ya tiene institución, redirigir al dashboard
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/']);
      return;
    }
    if (user.role === 'admin') {
      this.router.navigate(['/dashboard']);
      return;
    }
    if (user.profile?.institucion) {
      this.router.navigate(['/dashboard']);
      return;
    }
    // Pre-seleccionar rol actual si no es estudiante
    if (user.role && user.role !== 'estudiante') {
      this.selectedRole.set(user.role as OnboardingRole);
    }
  }

  goToStep2(): void {
    if (!this.selectedRole()) return;
    this.currentStep.set(2);
    this.loadInstitutions();
  }

  private loadInstitutions(): void {
    if (this.allInstitutions().length > 0) return;
    this.isLoadingInstitutions.set(true);
    this.institutionService.getPublicInstitutions().subscribe({
      next: (data) => {
        this.allInstitutions.set(data);
        this.filteredInstitutions.set(data);
        this.isLoadingInstitutions.set(false);
      },
      error: () => {
        this.isLoadingInstitutions.set(false);
        this.error.set('No se pudo cargar la lista de instituciones. Intenta de nuevo.');
      },
    });
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredInstitutions.set(this.allInstitutions());
    } else {
      this.filteredInstitutions.set(
        this.allInstitutions().filter(i =>
          i.nombre.toLowerCase().includes(q) ||
          (i.codigo_dane || '').toLowerCase().includes(q)
        )
      );
    }
  }

  submit(): void {
    if (!this.selectedRole() || !this.selectedInstitution()) return;
    this.isSubmitting.set(true);
    this.error.set(null);

    const payload = {
      role: this.selectedRole(),
      institucion_id: this.selectedInstitution()!.id,
    };

    const apiUrl = AUTH_ENDPOINTS.PROFILE_UPDATE;
    this.http.patch<{ message: string; user: any }>(apiUrl, payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        // Actualizar el usuario en el AuthService con la respuesta del servidor
        if (res.user) {
          this.authService.updateCurrentUser(res.user);
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const detail = err?.error?.detail || err?.error?.errors
          ? JSON.stringify(err.error.errors)
          : 'No se pudo completar el registro. Intenta de nuevo.';
        this.error.set(typeof detail === 'string' ? detail : 'Error al guardar el perfil.');
      },
    });
  }
}
