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

interface Color {
  hex: string;
  nombre: string;
}

@Component({
  selector: 'app-institution-branding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs transition-all duration-300">
      
      <!-- CABECERA PRINCIPAL (Siempre visible, con botón para contraer/desplegar) -->
      <div 
        class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none"
        (click)="toggleExpand()"
      >
        <div class="flex items-center gap-3">
          <!-- Miniatura del logo actual -->
          <div class="w-11 h-11 rounded-xl border border-border bg-bg flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
            @if (logoPreview() || logo) {
              <img [src]="logoPreview() || logo" alt="Logo Institucional" class="w-full h-full object-contain p-1" />
            } @else {
              <div 
                class="w-full h-full flex items-center justify-center font-black text-sm"
                [style.background]="colorPrimario"
                [style.color]="isLightColor(colorPrimario) ? '#0a0a0a' : '#ffffff'"
              >
                {{ (nombre ? nombre[0] : 'E').toUpperCase() }}
              </div>
            }
          </div>

          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-slate-900 dark:text-neutral-100 text-base">
                Identidad Institucional
              </h3>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                Activo
              </span>
            </div>
            <p class="text-xs text-text-muted mt-0.5 truncate max-w-xs sm:max-w-md">
              {{ nombre || 'Colegio o Institución Educativa' }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 self-end sm:self-center">
          <!-- Muestras compactas de colores actuales -->
          <div class="flex items-center gap-1.5 p-1 rounded-lg bg-bg border border-border">
            <span 
              class="w-4 h-4 rounded-full border border-black/10 dark:border-white/10" 
              [style.background]="colorPrimario" 
              [title]="'Color Primario: ' + getNombreColor(colorPrimario)"
            ></span>
            <span 
              class="w-4 h-4 rounded-full border border-black/10 dark:border-white/10" 
              [style.background]="colorSecundario" 
              [title]="'Color Secundario: ' + getNombreColor(colorSecundario)"
            ></span>
          </div>

          <!-- Botón Toggle Contraer / Desplegar -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-bg border border-border text-text hover:border-primary transition-all cursor-pointer"
            (click)="$event.stopPropagation(); toggleExpand()"
          >
            <span>{{ isExpanded() ? 'Contraer' : 'Personalizar' }}</span>
            <svg 
              class="w-4 h-4 transition-transform duration-200" 
              [class.rotate-180]="isExpanded()" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- CUERPO DESPLEGABLE CON FORMULARIO COMPLETO -->
      @if (isExpanded()) {
        <div class="p-6 pt-2 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200 space-y-6">
          <p class="text-xs text-text-muted">
            Personaliza los colores institucionales y el logotipo. Los cambios de color y nombre se aplican en tiempo real en los paneles, encabezados y menús de todos los miembros.
          </p>

          <form (ngSubmit)="saveBranding()" class="space-y-6">
            
            <!-- Nombre de la Institución y Carga de Logo -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <!-- Campo: Nombre -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Nombre de la Institución *
                </label>
                <input 
                  type="text" 
                  name="nombre" 
                  [(ngModel)]="nombre" 
                  class="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text font-medium"
                  placeholder="Ej: Colegio San José"
                  required
                />
                <p class="text-[11px] text-text-muted">
                  Aparecerá en el encabezado superior y en los reportes académicos descargables.
                </p>
              </div>

              <!-- Campo: Subir Imagen / Logo -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Logotipo Oficial (JPG, JPEG, PNG)
                </label>
                
                <div class="flex items-center gap-3">
                  <!-- Vista previa o Placeholder -->
                  <div class="w-14 h-14 rounded-xl border border-border bg-bg flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative group">
                    @if (logoPreview() || logo) {
                      <img [src]="logoPreview() || logo" alt="Preview logo" class="w-full h-full object-contain p-1" />
                    } @else {
                      <svg class="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    }
                  </div>

                  <!-- Botones de Acción de Archivo -->
                  <div class="flex flex-col gap-1.5">
                    <input 
                      #fileInput
                      type="file" 
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png" 
                      class="hidden" 
                      (change)="onFileSelected($event)" 
                    />
                    
                    <div class="flex items-center gap-2">
                      <button 
                        type="button" 
                        (click)="fileInput.click()"
                        class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-bg hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text transition-colors cursor-pointer"
                      >
                        {{ (logoPreview() || logo) ? 'Cambiar Archivo' : 'Subir Archivo' }}
                      </button>

                      @if (logoPreview() || logo) {
                        <button 
                          type="button" 
                          (click)="removeLogo()"
                          class="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Quitar logotipo"
                        >
                          Quitar
                        </button>
                      }
                    </div>

                    <span class="text-[10px] text-text-muted">
                      JPG, JPEG o PNG hasta 2MB. Se guarda localmente y en el servidor.
                    </span>
                  </div>
                </div>
              </div>

            </div>

            <!-- Paletas Sugeridas (Acceso Rápido) -->
            <div class="space-y-3 pt-1">
              <label class="text-xs font-semibold text-text-muted uppercase tracking-wide">
                Combinaciones Sugeridas
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                @for (p of palettes; track p.name) {
                  <button 
                    type="button"
                    (click)="applyPalette(p)"
                    class="flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer hover:scale-[1.02]"
                    [class.border-primary]="isCurrentPalette(p)"
                    [class.ring-1]="isCurrentPalette(p)"
                    [class.ring-primary]="isCurrentPalette(p)"
                    [class.border-border]="!isCurrentPalette(p)"
                    [class.bg-bg]="!isCurrentPalette(p)"
                  >
                    <div class="flex h-5 w-full rounded-md overflow-hidden shadow-2xs border border-border/50">
                      <div class="flex-1" [style.backgroundColor]="p.primary"></div>
                      <div class="flex-1" [style.backgroundColor]="p.secondary"></div>
                    </div>
                    <span 
                      class="text-[11px] font-medium" 
                      [class.text-primary]="isCurrentPalette(p)" 
                      [class.text-text-muted]="!isCurrentPalette(p)"
                    >
                      {{ p.name }}
                    </span>
                  </button>
                }
              </div>
            </div>

            <!-- Selector de Color Principal (Con Grises + Colores y Contraste Dinámico) -->
            <div class="space-y-3 pt-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <label class="text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Color Principal
                  </label>
                  @if (isLightColor(colorPrimario)) {
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Color Claro: Letras automáticas en Negro
                    </span>
                  }
                </div>
                <div class="flex items-center gap-2">
                  <div 
                    class="w-5 h-5 rounded-md border border-border shadow-2xs flex-shrink-0"
                    [style.background]="colorPrimario"
                  ></div>
                  <span class="text-xs font-bold" [style.color]="colorPrimario">
                    {{ getNombreColor(colorPrimario) }}
                  </span>
                </div>
              </div>

              <!-- Grilla de Colores con contraste inteligente en checkmark -->
              <div class="grid grid-cols-6 sm:grid-cols-10 gap-1.5 p-3 bg-bg rounded-xl border border-border">
                @for (color of coloresDisponibles; track color.hex) {
                  <button
                    type="button"
                    (click)="seleccionarPrimario(color.hex)"
                    class="relative w-full aspect-square rounded-lg transition-all duration-150 focus:outline-none cursor-pointer group border border-border/60"
                    [style.background]="color.hex"
                    [class.scale-110]="colorPrimario === color.hex"
                    [class.shadow-md]="colorPrimario === color.hex"
                    [class.ring-2]="colorPrimario === color.hex"
                    [class.ring-primary]="colorPrimario === color.hex"
                    [title]="color.nombre + ' (' + color.hex + ')'"
                  >
                    <!-- Tooltip al hover -->
                    <span class="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[9px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-md">
                      {{ color.nombre }}
                    </span>

                    @if (colorPrimario === color.hex) {
                      <svg 
                        class="w-3.5 h-3.5 absolute inset-0 m-auto drop-shadow-xs"
                        [style.color]="isLightColor(color.hex) ? '#0a0a0a' : '#ffffff'"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7"/>
                      </svg>
                    }
                  </button>
                }
              </div>
            </div>

            <!-- Selector de Color Secundario (Con Grises + Colores y Contraste Dinámico) -->
            <div class="space-y-3 pt-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <label class="text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Color Secundario / Acento
                  </label>
                  @if (isLightColor(colorSecundario)) {
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Color Claro: Letras automáticas en Negro
                    </span>
                  }
                </div>
                <div class="flex items-center gap-2">
                  <div 
                    class="w-5 h-5 rounded-md border border-border shadow-2xs flex-shrink-0"
                    [style.background]="colorSecundario"
                  ></div>
                  <span class="text-xs font-bold" [style.color]="colorSecundario">
                    {{ getNombreColor(colorSecundario) }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-6 sm:grid-cols-10 gap-1.5 p-3 bg-bg rounded-xl border border-border">
                @for (color of coloresDisponibles; track color.hex) {
                  <button
                    type="button"
                    (click)="seleccionarSecundario(color.hex)"
                    class="relative w-full aspect-square rounded-lg transition-all duration-150 focus:outline-none cursor-pointer group border border-border/60"
                    [style.background]="color.hex"
                    [class.scale-110]="colorSecundario === color.hex"
                    [class.shadow-md]="colorSecundario === color.hex"
                    [class.ring-2]="colorSecundario === color.hex"
                    [class.ring-primary]="colorSecundario === color.hex"
                    [title]="color.nombre + ' (' + color.hex + ')'"
                  >
                    <span class="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[9px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-md">
                      {{ color.nombre }}
                    </span>

                    @if (colorSecundario === color.hex) {
                      <svg 
                        class="w-3.5 h-3.5 absolute inset-0 m-auto drop-shadow-xs"
                        [style.color]="isLightColor(color.hex) ? '#0a0a0a' : '#ffffff'"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7"/>
                      </svg>
                    }
                  </button>
                }
              </div>
            </div>

            <!-- Vista Previa de Contraste en Botones -->
            <div class="rounded-xl border border-border bg-bg p-4 space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-text-muted">Vista previa de contraste en botones</p>
                <span class="text-[11px] text-text-muted font-mono">
                  Texto: {{ isLightColor(colorPrimario) ? 'Oscuro (#0A0A0A)' : 'Blanco (#FFFFFF)' }}
                </span>
              </div>

              <div class="flex items-center gap-3 flex-wrap">
                <button 
                  type="button" 
                  class="px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs border border-black/10 dark:border-white/10"
                  [style.background]="colorPrimario"
                  [style.color]="isLightColor(colorPrimario) ? '#0a0a0a' : '#ffffff'"
                >
                  Botón Principal
                </button>
                <button 
                  type="button" 
                  class="px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs border border-black/10 dark:border-white/10"
                  [style.background]="colorSecundario"
                  [style.color]="isLightColor(colorSecundario) ? '#0a0a0a' : '#ffffff'"
                >
                  Botón Secundario
                </button>
                <div class="flex items-center gap-2 text-xs text-text-muted">
                  <span class="font-medium">{{ getNombreColor(colorPrimario) }}</span>
                  <span>+</span>
                  <span class="font-medium">{{ getNombreColor(colorSecundario) }}</span>
                </div>
              </div>
            </div>

            <!-- Footer: Botón Guardar -->
            <div class="pt-4 border-t border-border flex items-center justify-between">
              <button
                type="button"
                (click)="toggleExpand()"
                class="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-bg hover:bg-black/5 dark:hover:bg-white/5 text-text-muted cursor-pointer transition-colors"
              >
                Cerrar Editor
              </button>

              <button 
                type="submit" 
                [disabled]="isSaving()"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-black/10 dark:border-white/10"
                [style.background]="isSaving() ? '#6b7280' : colorPrimario"
                [style.color]="isLightColor(colorPrimario) ? '#0a0a0a' : '#ffffff'"
              >
                @if (isSaving()) {
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Guardando...</span>
                } @else {
                  <span>Guardar Identidad Institucional</span>
                }
              </button>
            </div>
          </form>
        </div>
      }

    </div>
  `
})
export class InstitutionBrandingComponent implements OnInit {
  private authService = inject(AuthService);
  private institutionService = inject(InstitutionService);
  private notificationService = inject(NotificationService);
  private themeService = inject(ThemeService);

  isExpanded = signal(false);
  isSaving = signal(false);

  institutionId: number | null = null;
  nombre = '';
  logo = '';
  logoPreview = signal<string | null>(null);
  selectedFile: File | null = null;

  colorPrimario = '#ea580c';
  colorSecundario = '#3b82f6';

  palettes: Palette[] = [
    { name: 'EduBid Clásico', primary: '#ea580c', secondary: '#3b82f6' },
    { name: 'Monocromo Minimalista', primary: '#18181b', secondary: '#71717a' },
    { name: 'Plata & Grafito', primary: '#ffffff', secondary: '#3f3f46' },
    { name: 'Esmeralda', primary: '#059669', secondary: '#10b981' },
    { name: 'Prestigio', primary: '#7c3aed', secondary: '#a855f7' },
    { name: 'Océano', primary: '#2563eb', secondary: '#06b6d4' },
    { name: 'Rubí', primary: '#dc2626', secondary: '#f97316' },
    { name: 'Dorado', primary: '#d97706', secondary: '#f59e0b' },
  ];

  coloresDisponibles: Color[] = [
    // ──────── Escala de Grises y Neutros ────────
    { hex: '#ffffff', nombre: 'Blanco Puro' },
    { hex: '#f4f4f5', nombre: 'Gris Perla' },
    { hex: '#d4d4d8', nombre: 'Plata Claro' },
    { hex: '#9ca3af', nombre: 'Plata Medio' },
    { hex: '#71717a', nombre: 'Gris Zinc' },
    { hex: '#3f3f46', nombre: 'Grafito Oscuro' },
    { hex: '#18181b', nombre: 'Negro Carbón' },
    { hex: '#09090b', nombre: 'Negro Profundo' },

    // ──────── Naranjados y Rojos ────────
    { hex: '#ea580c', nombre: 'Naranja EduBid' },
    { hex: '#f97316', nombre: 'Naranja Vivo' },
    { hex: '#dc2626', nombre: 'Rojo Fuego' },
    { hex: '#ef4444', nombre: 'Rojo Coral' },
    { hex: '#b91c1c', nombre: 'Rojo Carmesí' },
    { hex: '#7f1d1d', nombre: 'Burdeos' },

    // ──────── Amarillos y Tierra ────────
    { hex: '#d97706', nombre: 'Ámbar Dorado' },
    { hex: '#f59e0b', nombre: 'Amarillo Sol' },
    { hex: '#eab308', nombre: 'Oro Brillante' },
    { hex: '#92400e', nombre: 'Café Oscuro' },
    { hex: '#78350f', nombre: 'Marrón Tierra' },

    // ──────── Verdes ────────
    { hex: '#16a34a', nombre: 'Verde Naturaleza' },
    { hex: '#059669', nombre: 'Esmeralda' },
    { hex: '#0d9488', nombre: 'Verde Azulado' },
    { hex: '#10b981', nombre: 'Menta' },
    { hex: '#065f46', nombre: 'Bosque Profundo' },

    // ──────── Azules y Cianes ────────
    { hex: '#2563eb', nombre: 'Azul Royal' },
    { hex: '#3b82f6', nombre: 'Azul Clásico' },
    { hex: '#0891b2', nombre: 'Cian Océano' },
    { hex: '#06b6d4', nombre: 'Celeste' },
    { hex: '#1e40af', nombre: 'Azul Marino' },

    // ──────── Morados y Rosas ────────
    { hex: '#7c3aed', nombre: 'Violeta Prestigio' },
    { hex: '#9333ea', nombre: 'Púrpura' },
    { hex: '#a855f7', nombre: 'Lavanda' },
    { hex: '#ec4899', nombre: 'Rosa Fucsia' },
  ];

  ngOnInit(): void {
    // Intentar leer nombre persistido localmente si existe
    if (typeof localStorage !== 'undefined') {
      const savedName = localStorage.getItem('edubid_institution_name');
      const savedLogo = localStorage.getItem('edubid_institution_logo');
      if (savedName) this.nombre = savedName;
      if (savedLogo) this.logoPreview.set(savedLogo);
    }

    const user = this.authService.currentUser();
    if (user?.profile?.institucion) {
      this.institutionId = user.profile.institucion.id;
      if (!this.nombre) {
        this.nombre = user.profile.institucion.nombre;
      }
      this.logo = user.profile.institucion.logo || '';
      this.colorPrimario = user.profile.institucion.color_primario || '#ea580c';
      this.colorSecundario = user.profile.institucion.color_secundario || '#3b82f6';
    }
  }

  toggleExpand(): void {
    this.isExpanded.update(v => !v);
  }

  /**
   * Determina si un color hexadecimal es claro usando la fórmula de luminosidad YIQ.
   * Si es claro, el texto debe ser negro (#0A0A0A) para garantizar contraste accesible.
   */
  isLightColor(hex: string): boolean {
    if (!hex) return false;
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return false;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 160;
  }

  applyPalette(palette: Palette): void {
    this.colorPrimario = palette.primary;
    this.colorSecundario = palette.secondary;
  }

  isCurrentPalette(palette: Palette): boolean {
    return this.colorPrimario === palette.primary && this.colorSecundario === palette.secondary;
  }

  getNombreColor(hex: string): string {
    return this.coloresDisponibles.find(c => c.hex.toLowerCase() === hex.toLowerCase())?.nombre || 'Personalizado';
  }

  seleccionarPrimario(hex: string): void {
    this.colorPrimario = hex;
  }

  seleccionarSecundario(hex: string): void {
    this.colorSecundario = hex;
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    // Validación de extensiones permitidas
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      this.notificationService.error('Formato no válido. Selecciona un archivo JPG, JPEG o PNG.');
      return;
    }

    // Validación de tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.notificationService.error('El archivo excede el tamaño máximo de 2MB.');
      return;
    }

    this.selectedFile = file;

    // Leer como DataURL para previsualización inmediata y guardado en localStorage
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.logoPreview.set(dataUrl);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('edubid_institution_logo', dataUrl);
      }
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.selectedFile = null;
    this.logoPreview.set(null);
    this.logo = '';
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('edubid_institution_logo');
    }
  }

  saveBranding(): void {
    if (!this.institutionId) {
      this.notificationService.error('No se encontró una institución asociada a tu cuenta.');
      return;
    }

    if (!this.nombre.trim()) {
      this.notificationService.error('El nombre de la institución es obligatorio.');
      return;
    }

    this.isSaving.set(true);

    // Preparar FormData para soportar archivo binario de logo + campos de texto
    const formData = new FormData();
    formData.append('nombre', this.nombre.trim());
    formData.append('color_primario', this.colorPrimario);
    formData.append('color_secundario', this.colorSecundario);

    if (this.selectedFile) {
      formData.append('logo', this.selectedFile);
    } else if (!this.logoPreview() && !this.logo) {
      formData.append('logo', '');
    }

    this.institutionService.updateInstitution(this.institutionId, formData).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.notificationService.success('¡Identidad institucional guardada exitosamente!');

        // Guardar nombre y logo localmente para persistencia garantizada
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('edubid_institution_name', this.nombre.trim());
          if (res.logo) {
            localStorage.setItem('edubid_institution_logo', res.logo);
          } else if (!this.logoPreview() && !this.logo) {
            localStorage.removeItem('edubid_institution_logo');
          }
        }

        // Actualizar sesión actual
        const user = this.authService.currentUser();
        if (user?.profile?.institucion) {
          user.profile.institucion.nombre = this.nombre.trim();
          user.profile.institucion.color_primario = this.colorPrimario;
          user.profile.institucion.color_secundario = this.colorSecundario;
          if (res.logo) {
            user.profile.institucion.logo = res.logo;
          } else if (!this.logoPreview() && !this.logo) {
            user.profile.institucion.logo = null;
          }
        }

        // Inyectar colores de marca en el ThemeService
        const effectiveLogo = this.logoPreview() || res.logo || this.logo;
        this.themeService.injectBrandColors({
          id: this.institutionId!,
          nombre: this.nombre.trim(),
          logo: effectiveLogo,
          color_primario: this.colorPrimario,
          color_secundario: this.colorSecundario
        });

        // Disparar evento en window para que otros componentes (ej: RectorDashboard) se enteren
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('edubid:institution-updated', {
            detail: {
              nombre: this.nombre.trim(),
              logo: effectiveLogo,
              color_primario: this.colorPrimario,
              color_secundario: this.colorSecundario
            }
          }));
        }

        // Contraer el editor tras guardar con éxito
        this.isExpanded.set(false);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Error actualizando institución:', err);
        const detail = err.error?.detail || err.error?.nombre?.[0] || 'Error al actualizar la identidad institucional.';
        this.notificationService.error(detail);
      }
    });
  }
}
