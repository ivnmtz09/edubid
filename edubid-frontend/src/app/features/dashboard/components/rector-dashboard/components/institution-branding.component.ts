import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../core/services/auth.service';
import { InstitutionService } from '../../../../../core/services/institution.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ThemeService } from '../../../../../core/services/theme.service';

interface Palette {
  name: string;
  primary: string;
  secondary: string;
}

@Component({
  selector: 'app-institution-branding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 rounded-2xl border border-border bg-surface space-y-6">
      <div>
        <h3 class="font-bold text-slate-900 dark:text-white text-lg">
          Identidad Institucional
        </h3>
        <p class="text-sm text-text-muted mt-1">
          Personaliza los colores y el logotipo de tu institución. Estos cambios afectarán a todos los estudiantes y docentes de tu colegio.
        </p>
      </div>

      <form (ngSubmit)="saveBranding()" class="space-y-6">
        
        <!-- Nombre y Logo -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-text-muted">Nombre de la Institución</label>
            <input 
              type="text" 
              name="nombre" 
              [(ngModel)]="nombre" 
              class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text"
              placeholder="Ej: Colegio San José"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-text-muted">URL del Logotipo (Opcional)</label>
            <input 
              type="url" 
              name="logo" 
              [(ngModel)]="logo" 
              class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text"
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>
        </div>

        <!-- Paletas Predefinidas -->
        <div class="space-y-3">
          <label class="text-xs font-semibold text-text-muted">Paletas Sugeridas</label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            @for (p of palettes; track p.name) {
              <button 
                type="button"
                (click)="applyPalette(p)"
                class="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.02]"
                [class.border-primary]="isCurrentPalette(p)"
                [class.ring-1]="isCurrentPalette(p)"
                [class.ring-primary]="isCurrentPalette(p)"
                [class.border-border]="!isCurrentPalette(p)"
                [class.bg-bg]="!isCurrentPalette(p)"
                [class.bg-primary]="isCurrentPalette(p) && false" 
              >
                <div class="flex h-6 w-full rounded-md overflow-hidden shadow-xs">
                  <div class="flex-1" [style.backgroundColor]="p.primary"></div>
                  <div class="flex-1" [style.backgroundColor]="p.secondary"></div>
                </div>
                <span class="text-[11px] font-medium" [class.text-primary]="isCurrentPalette(p)" [class.text-text-muted]="!isCurrentPalette(p)">
                  {{ p.name }}
                </span>
              </button>
            }
          </div>
        </div>

        <!-- Paleta Personalizada -->
        <div class="space-y-3 pt-2">
          <label class="text-xs font-semibold text-text-muted">Colores Personalizados</label>
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-3">
              <input 
                type="color" 
                name="colorPrimario" 
                [(ngModel)]="colorPrimario" 
                class="w-10 h-10 p-0.5 rounded-lg border border-border bg-bg cursor-pointer"
              />
              <span class="text-sm text-text font-medium">Primario</span>
            </div>
            <div class="flex items-center gap-3">
              <input 
                type="color" 
                name="colorSecundario" 
                [(ngModel)]="colorSecundario" 
                class="w-10 h-10 p-0.5 rounded-lg border border-border bg-bg cursor-pointer"
              />
              <span class="text-sm text-text font-medium">Secundario</span>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-border flex justify-end">
          <button 
            type="submit" 
            [disabled]="isSaving()"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (isSaving()) {
              <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span>Guardando...</span>
            } @else {
              <span>Guardar Cambios</span>
            }
          </button>
        </div>
      </form>
    </div>
  `
})
export class InstitutionBrandingComponent implements OnInit {
  private authService = inject(AuthService);
  private institutionService = inject(InstitutionService);
  private notificationService = inject(NotificationService);
  private themeService = inject(ThemeService);

  institutionId: number | null = null;
  nombre = '';
  logo = '';
  colorPrimario = '#ea580c';
  colorSecundario = '#3b82f6';

  isSaving = signal(false);

  palettes: Palette[] = [
    { name: 'EduBid Clásico', primary: '#ea580c', secondary: '#3b82f6' },
    { name: 'Océano', primary: '#0891b2', secondary: '#4f46e5' },
    { name: 'Naturaleza', primary: '#059669', secondary: '#d97706' },
    { name: 'Prestigio', primary: '#7c3aed', secondary: '#ec4899' },
  ];

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user?.profile?.institucion) {
      this.institutionId = user.profile.institucion.id;
      this.nombre = user.profile.institucion.nombre;
      this.logo = user.profile.institucion.logo || '';
      this.colorPrimario = user.profile.institucion.color_primario || '#ea580c';
      this.colorSecundario = user.profile.institucion.color_secundario || '#3b82f6';
    }
  }

  applyPalette(palette: Palette) {
    this.colorPrimario = palette.primary;
    this.colorSecundario = palette.secondary;
  }

  isCurrentPalette(palette: Palette): boolean {
    return this.colorPrimario === palette.primary && this.colorSecundario === palette.secondary;
  }

  saveBranding() {
    if (!this.institutionId) {
      this.notificationService.error('No se encontró una institución asociada.');
      return;
    }

    this.isSaving.set(true);

    const payload = {
      nombre: this.nombre,
      logo: this.logo || null,
      color_primario: this.colorPrimario,
      color_secundario: this.colorSecundario
    };

    this.institutionService.updateInstitution(this.institutionId, payload as any).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.notificationService.success('Identidad institucional actualizada correctamente.');
        
        // Actualizar el ThemeService para que se apliquen los colores inmediatamente
        // y actualizar al currentUser si es posible (en una app real se pediría el perfil de nuevo)
        // Por ahora simulamos la inyección visual:
        this.themeService.injectBrandColors({
          ...payload,
          id: this.institutionId!,
          logo: payload.logo as string | null
        });
        
        // Ideally we fetch the profile again to sync state:
        // this.authService.refreshProfile().subscribe();
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error(err);
        this.notificationService.error('Error al actualizar la identidad.');
      }
    });
  }
}
