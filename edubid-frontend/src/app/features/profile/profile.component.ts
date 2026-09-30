import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      
      <!-- ================= ENCABEZADO DE PÁGINA ================= -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface border border-border text-text-muted mb-2">
            <span>Cuenta</span>
            <span>•</span>
            <span class="font-mono text-slate-900 dark:text-neutral-100">Mi Perfil</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
            Perfil de Usuario
          </h1>
          <p class="text-sm text-text-muted mt-1">
            Gestiona tus datos personales, credenciales de acceso y preferencias de tu cuenta en EduBid.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border"
            style="background: color-mix(in srgb, var(--brand-primary) 12%, transparent); color: var(--brand-primary); border-color: color-mix(in srgb, var(--brand-primary) 25%, transparent);"
          >
            <span class="w-2 h-2 rounded-full" style="background-color: var(--brand-primary);"></span>
            Rol: {{ userRole() }}
          </span>
        </div>
      </div>

      <!-- ================= TARJETA DE RESUMEN DE IDENTIDAD ================= -->
      <div class="p-6 rounded-2xl border border-border bg-surface shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <!-- Avatar con Iniciales / Fotografía -->
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-md shrink-0"
            style="background: linear-gradient(135deg, var(--brand-primary), var(--brand-accent));"
          >
            {{ userInitials() }}
          </div>

          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-lg font-bold text-slate-900 dark:text-neutral-100">
                {{ userFullName() }}
              </h2>
              @if (currentUser()?.is_verified) {
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  Verificado
                </span>
              }
            </div>

            <p class="text-xs text-text-muted font-mono">
              {{ currentUser()?.email }}
            </p>

            @if (institutionName()) {
              <div class="flex items-center gap-1.5 text-xs text-text-muted pt-0.5">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <span class="font-medium text-slate-800 dark:text-neutral-200">{{ institutionName() }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Métricas Rápidas según Rol -->
        <div class="flex items-center gap-4 flex-wrap border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 text-xs">
          <div>
            <span class="text-[10px] font-semibold text-text-muted uppercase block">Miembro desde</span>
            <span class="font-mono font-bold text-text">{{ memberSinceFormatted() }}</span>
          </div>

          <div>
            <span class="text-[10px] font-semibold text-text-muted uppercase block">Estado</span>
            <span class="inline-flex items-center gap-1 font-bold text-emerald-600">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Activo
            </span>
          </div>
        </div>
      </div>

      <!-- ================= SELECTOR DE PESTAÑAS ================= -->
      <div class="flex items-center gap-2 border-b border-border pb-1">
        <button
          type="button"
          (click)="activeTab.set('datos')"
          class="px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer border"
          [class.bg-surface]="activeTab() === 'datos'"
          [class.border-border]="activeTab() === 'datos'"
          [class.shadow-xs]="activeTab() === 'datos'"
          [class.text-primary]="activeTab() === 'datos'"
          [class.text-text-muted]="activeTab() !== 'datos'"
          [class.border-transparent]="activeTab() !== 'datos'"
          [class.hover:text-text]="activeTab() !== 'datos'"
        >
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Información Personal
          </span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('seguridad')"
          class="px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer border"
          [class.bg-surface]="activeTab() === 'seguridad'"
          [class.border-border]="activeTab() === 'seguridad'"
          [class.shadow-xs]="activeTab() === 'seguridad'"
          [class.text-primary]="activeTab() === 'seguridad'"
          [class.text-text-muted]="activeTab() !== 'seguridad'"
          [class.border-transparent]="activeTab() !== 'seguridad'"
          [class.hover:text-text]="activeTab() !== 'seguridad'"
        >
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            Seguridad y Contraseña
          </span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('institucion')"
          class="px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer border"
          [class.bg-surface]="activeTab() === 'institucion'"
          [class.border-border]="activeTab() === 'institucion'"
          [class.shadow-xs]="activeTab() === 'institucion'"
          [class.text-primary]="activeTab() === 'institucion'"
          [class.text-text-muted]="activeTab() !== 'institucion'"
          [class.border-transparent]="activeTab() !== 'institucion'"
          [class.hover:text-text]="activeTab() !== 'institucion'"
        >
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            Detalles Institucionales
          </span>
        </button>
      </div>

      <!-- ================= PESTAÑA 1: DATOS PERSONALES ================= -->
      @if (activeTab() === 'datos') {
        <div class="p-6 rounded-2xl border border-border bg-surface space-y-6">
          <div class="border-b border-border pb-4">
            <h3 class="text-base font-bold text-slate-900 dark:text-neutral-100">
              Datos Personales
            </h3>
            <p class="text-xs text-text-muted mt-1">
              Actualiza tu información pública de contacto y datos identificativos dentro del colegio.
            </p>
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Nombres -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-text-muted">Nombre(s) *</label>
                <input
                  type="text"
                  formControlName="first_name"
                  placeholder="Tu nombre"
                  class="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                />
              </div>

              <!-- Apellidos -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-text-muted">Apellido(s) *</label>
                <input
                  type="text"
                  formControlName="last_name"
                  placeholder="Tu apellido"
                  class="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <!-- Correo (Readonly) -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-text-muted">Correo Electrónico Institucional</label>
              <div class="relative">
                <input
                  type="email"
                  [value]="currentUser()?.email"
                  readonly
                  disabled
                  class="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-900/60 border border-border rounded-xl text-sm text-text-muted cursor-not-allowed font-mono"
                />
                <span class="absolute right-3 top-2.5 text-[11px] font-semibold text-text-muted">
                  No modificable
                </span>
              </div>
              <p class="text-[11px] text-text-muted">
                El correo está vinculado a tu cuenta y sesiones activas. Para solicitar un cambio, contacta al rector de tu colegio.
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Teléfono -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-text-muted">Teléfono de Contacto (Opcional)</label>
                <input
                  type="tel"
                  formControlName="telefono"
                  placeholder="Ej: 300 123 4567"
                  class="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                />
              </div>

              <!-- Dirección -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-text-muted">Dirección de Residencia (Opcional)</label>
                <input
                  type="text"
                  formControlName="direccion"
                  placeholder="Ej: Calle 10 # 20-30"
                  class="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <!-- Biografía / Notas -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-text-muted">Biografía o Especialidad Pedagógica (Opcional)</label>
              <textarea
                formControlName="bio"
                rows="3"
                placeholder="Breve reseña sobre tus intereses académicos o materias..."
                class="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none transition-colors resize-none"
              ></textarea>
            </div>

            <!-- Botón Guardar -->
            <div class="flex justify-end pt-3 border-t border-border">
              <button
                type="submit"
                [disabled]="profileForm.invalid || isSavingProfile()"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                @if (isSavingProfile()) {
                  <svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  <span>Guardando...</span>
                } @else {
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  <span>Guardar Información</span>
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- ================= PESTAÑA 2: SEGURIDAD Y CONTRASEÑA ================= -->
      @if (activeTab() === 'seguridad') {
        <div class="p-6 rounded-2xl border border-border bg-surface space-y-6">
          <div class="border-b border-border pb-4">
            <h3 class="text-base font-bold text-slate-900 dark:text-neutral-100">
              Seguridad y Cambio de Contraseña
            </h3>
            <p class="text-xs text-text-muted mt-1">
              Actualiza tu clave periódicamente para mantener tu cuenta y tus EduCoins protegidos.
            </p>
          </div>

          <form [formGroup]="passwordForm" (ngSubmit)="savePassword()" class="space-y-4 max-w-lg">
            <!-- Contraseña Actual -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-text-muted">Contraseña Actual *</label>
              <div class="relative">
                <input
                  [type]="showOldPassword() ? 'text' : 'password'"
                  formControlName="old_password"
                  placeholder="Tu contraseña actual"
                  class="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none transition-colors pr-10"
                />
                <button
                  type="button"
                  (click)="showOldPassword.set(!showOldPassword())"
                  class="absolute right-3 top-2.5 text-text-muted hover:text-text cursor-pointer"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Nueva Contraseña -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-text-muted">Nueva Contraseña * (Mínimo 8 caracteres)</label>
              <div class="relative">
                <input
                  [type]="showNewPassword() ? 'text' : 'password'"
                  formControlName="new_password"
                  placeholder="Nueva contraseña segura"
                  class="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none transition-colors pr-10"
                />
                <button
                  type="button"
                  (click)="showNewPassword.set(!showNewPassword())"
                  class="absolute right-3 top-2.5 text-text-muted hover:text-text cursor-pointer"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Confirmar Contraseña -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-text-muted">Confirmar Nueva Contraseña *</label>
              <input
                type="password"
                formControlName="confirm_password"
                placeholder="Repite la nueva contraseña"
                class="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
              />
              @if (passwordForm.errors?.['mismatch'] && passwordForm.get('confirm_password')?.touched) {
                <p class="text-xs text-red-500 mt-1">Las contraseñas no coinciden.</p>
              }
            </div>

            <!-- Botón Cambiar Contraseña -->
            <div class="pt-3 border-t border-border flex justify-end">
              <button
                type="submit"
                [disabled]="passwordForm.invalid || isSavingPassword()"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                @if (isSavingPassword()) {
                  <svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  <span>Actualizando...</span>
                } @else {
                  <span>Actualizar Contraseña</span>
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- ================= PESTAÑA 3: DETALLES INSTITUCIONALES ================= -->
      @if (activeTab() === 'institucion') {
        <div class="p-6 rounded-2xl border border-border bg-surface space-y-6">
          <div class="border-b border-border pb-4">
            <h3 class="text-base font-bold text-slate-900 dark:text-neutral-100">
              Detalles Institucionales y Membresía
            </h3>
            <p class="text-xs text-text-muted mt-1">
              Información del colegio y parámetros de economía académica asignados a tu cuenta.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Card Colegio -->
            <div class="p-4 rounded-xl bg-bg border border-border space-y-2">
              <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Institución Educativa</span>
              <p class="text-sm font-bold text-slate-900 dark:text-neutral-100">
                {{ institutionName() || 'Plataforma EduBid Global' }}
              </p>
              <p class="text-xs text-text-muted">
                {{ currentUser()?.profile?.institucion?.codigo_dane ? 'DANE: ' + currentUser()?.profile?.institucion?.codigo_dane : 'SaaS Multi-Tenant' }}
              </p>
            </div>

            <!-- Card Rol -->
            <div class="p-4 rounded-xl bg-bg border border-border space-y-2">
              <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Nivel de Acceso (RBAC)</span>
              <p class="text-sm font-bold text-slate-900 dark:text-neutral-100 capitalize">
                {{ userRole() }}
              </p>
              <p class="text-xs text-text-muted">
                Permisos verificados por backend según políticas de seguridad.
              </p>
            </div>

            <!-- Card Regla de EduCoins -->
            <div class="p-4 rounded-xl bg-bg border border-border space-y-2">
              <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Microeconomía EduBid</span>
              <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Economía Meritocrática
              </p>
              <p class="text-xs text-text-muted">
                Los EduCoins se adquieren mediante actividades académicas calificadas.
              </p>
            </div>
          </div>

          <!-- Acceso a configuración si es Rector -->
          @if (userRole() === 'rector') {
            <div class="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 class="text-xs font-bold text-primary">¿Deseas personalizar la identidad de tu colegio?</h4>
                <p class="text-xs text-text-muted">Puedes modificar el logo, paleta de colores corporativa y código DANE en el Panel de Rectoría.</p>
              </div>
              <a
                routerLink="/dashboard/rector"
                class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover transition-colors shrink-0 text-center cursor-pointer shadow-xs"
              >
                Ir a Identidad Institucional
              </a>
            </div>
          }
        </div>
      }

    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private notifService = inject(NotificationService);
  private fb = inject(FormBuilder);

  currentUser = computed(() => this.authService.currentUser());
  userRole = computed(() => this.currentUser()?.role || 'estudiante');
  userFullName = computed(() => {
    const u = this.currentUser();
    return u ? `${u.first_name} ${u.last_name}`.trim() || u.email : 'Usuario';
  });
  userInitials = computed(() => {
    const u = this.currentUser();
    if (!u) return 'EB';
    const f = u.first_name?.[0] || '';
    const l = u.last_name?.[0] || '';
    return (f + l).toUpperCase() || 'EB';
  });
  institutionName = computed(() => {
    return this.currentUser()?.profile?.institucion?.nombre || null;
  });

  activeTab = signal<'datos' | 'seguridad' | 'institucion'>('datos');
  isSavingProfile = signal(false);
  isSavingPassword = signal(false);
  showOldPassword = signal(false);
  showNewPassword = signal(false);

  profileForm: FormGroup = this.fb.group({
    first_name: ['', [Validators.required, Validators.minLength(2)]],
    last_name: ['', [Validators.required, Validators.minLength(2)]],
    telefono: [''],
    direccion: [''],
    bio: [''],
  });

  passwordForm: FormGroup = this.fb.group(
    {
      old_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        telefono: user.profile?.telefono || '',
        direccion: user.profile?.direccion || '',
        bio: user.profile?.bio || '',
      });
    }

    // Consultar el perfil actualizado del backend
    this.userService.getProfile().subscribe({
      next: (res: any) => {
        const u = res?.user || res;
        if (u) {
          this.profileForm.patchValue({
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            telefono: u.profile?.telefono || '',
            direccion: u.profile?.direccion || '',
            bio: u.profile?.bio || '',
          });
        }
      },
      error: () => {},
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.isSavingProfile.set(true);

    const formVal = this.profileForm.value;
    const payload = {
      first_name: formVal.first_name,
      last_name: formVal.last_name,
      profile: {
        telefono: formVal.telefono,
        direccion: formVal.direccion,
        bio: formVal.bio,
      },
    };

    this.userService.updateProfile(payload).subscribe({
      next: (res: any) => {
        this.isSavingProfile.set(false);
        this.notifService.success('¡Perfil actualizado exitosamente!');

        // Actualizar el estado local de authService si viene el usuario actualizado
        const updated = res?.user || res;
        if (updated && updated.email) {
          const current = this.currentUser();
          if (current) {
            const merged = { ...current, ...updated };
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('edubid_user', JSON.stringify(merged));
            }
          }
        }
      },
      error: (err: any) => {
        this.isSavingProfile.set(false);
        const msg = err?.error?.message || err?.error?.detail || 'Error al actualizar el perfil.';
        this.notifService.error(msg);
      },
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) return;
    this.isSavingPassword.set(true);

    const val = this.passwordForm.value;
    this.userService
      .changePassword({
        old_password: val.old_password,
        new_password: val.new_password,
        confirm_password: val.confirm_password,
      })
      .subscribe({
        next: () => {
          this.isSavingPassword.set(false);
          this.passwordForm.reset();
          this.notifService.success('¡Contraseña actualizada correctamente!');
        },
        error: (err: any) => {
          this.isSavingPassword.set(false);
          const msg =
            err?.error?.message ||
            err?.error?.detail ||
            err?.error?.old_password?.[0] ||
            'Error al cambiar la contraseña. Verifica tu clave actual.';
          this.notifService.error(msg);
        },
      });
  }

  memberSinceFormatted(): string {
    const joined = this.currentUser()?.date_joined;
    if (!joined) return '2026';
    try {
      return new Date(joined).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
      });
    } catch {
      return '2026';
    }
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPass = form.get('new_password')?.value;
    const confirmPass = form.get('confirm_password')?.value;
    return newPass === confirmPass ? null : { mismatch: true };
  }
}
