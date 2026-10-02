import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InstitutionService } from '../../../../core/services/institution.service';
import { NotificationService } from '../../../../core/services/notification.service';

export interface Color {
  hex: string;
  nombre: string;
}

export interface BrandingPalette {
  name: string;
  primary: string;
  secondary: string;
}

@Component({
  selector: 'app-create-institution',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      
      <!-- Navegación superior / Breadcrumbs -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-xs text-text-muted">
            <a routerLink="/dashboard" class="hover:text-primary transition-colors flex items-center gap-1 font-medium cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Panel de Administración</span>
            </a>
            <span>/</span>
            <span class="text-text font-bold">Registrar Institución</span>
          </div>

          <div class="flex items-center gap-3 pt-1">
            <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Registrar Nueva Institución Educativa
              </h1>
              <p class="text-xs text-text-muted mt-0.5">
                Configura los datos oficiales, identidad corporativa y logotipo de la nueva institución.
              </p>
            </div>
          </div>
        </div>

        <!-- Botón Cancelar y volver -->
        <a
          routerLink="/dashboard"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-text transition-colors cursor-pointer self-start sm:self-center shadow-xs"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Cancelar</span>
        </a>
      </div>

      <!-- Cuadrícula Principal (2 Columnas: Formulario 2/3 y Live Mockup 1/3) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Columna Izquierda: Formulario Completo -->
        <div class="lg:col-span-2 space-y-6">
          <div class="p-6 rounded-2xl border border-border bg-surface space-y-6 shadow-xs">
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white text-base">
                Datos de la Institución & Configuración de Marca
              </h3>
              <p class="text-xs text-text-muted mt-1">
                La configuración visual se aplicará a todos los estudiantes, docentes y coordinadores asociados al colegio.
              </p>
            </div>

            <form (ngSubmit)="saveInstitution()" class="space-y-6">
              
              <!-- Datos Básicos: Nombre y Código DANE -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1.5 sm:col-span-2">
                  <label class="text-xs font-semibold text-text-muted">Nombre de la Institución *</label>
                  <input
                    type="text"
                    [ngModel]="nombre()"
                    (ngModelChange)="nombre.set($event)"
                    name="nombre"
                    required
                    class="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary text-text font-medium"
                    placeholder="Ej: Colegio San José"
                  />
                  <p class="text-[11px] text-text-muted">Nombre oficial con el que se identificará en la plataforma y reportes.</p>
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-text-muted">Código DANE (Opcional)</label>
                  <input
                    type="text"
                    [ngModel]="codigoDane()"
                    (ngModelChange)="codigoDane.set($event)"
                    name="codigoDane"
                    class="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary text-text font-mono"
                    placeholder="Ej: 105001002341"
                  />
                  <p class="text-[11px] text-text-muted">Identificador oficial del Ministerio de Educación.</p>
                </div>

                <!-- Estado Inicial: Activa / Inactiva -->
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-text-muted">Estado Inicial</label>
                  <div class="p-2.5 rounded-xl bg-bg border border-border flex items-center justify-between h-[46px]">
                    <span class="text-xs font-bold text-slate-900 dark:text-white">
                      {{ activo() ? 'Activa de inmediato' : 'Inactiva (Oculta)' }}
                    </span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        [ngModel]="activo()"
                        (ngModelChange)="activo.set($event)"
                        name="activo"
                        class="sr-only peer"
                      />
                      <div class="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  <p class="text-[11px] text-text-muted">Permite habilitar o pausar la operativa de la institución.</p>
                </div>
              </div>

              <!-- Logotipo Oficial (Supabase S3) -->
              <div class="space-y-3 p-4 rounded-xl bg-bg border border-border">
                <label class="text-xs font-semibold text-text-muted block uppercase tracking-wide">Logotipo Oficial</label>
                
                <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                  <!-- Cuadro de Vista Previa -->
                  <div class="w-16 h-16 rounded-xl border border-border bg-surface flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    @if (logoPreview() || logo()) {
                      <img [src]="logoPreview() || logo()" alt="Logo Institucional" class="w-full h-full object-contain p-1" />
                    } @else {
                      <div
                        class="w-full h-full flex items-center justify-center font-black text-lg"
                        [style.background]="colorPrimario()"
                        [style.color]="isLightColor(colorPrimario()) ? '#0a0a0a' : '#ffffff'"
                      >
                        {{ (nombre() ? nombre()[0] : 'N').toUpperCase() }}
                      </div>
                    }
                  </div>

                  <div class="space-y-2 flex-1">
                    <div class="flex items-center gap-2">
                      <label class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer shadow-2xs">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>{{ (logoPreview() || logo()) ? 'Cambiar Archivo' : 'Subir Archivo' }}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          (change)="onFileSelected($event)"
                          class="sr-only"
                        />
                      </label>

                      @if (logoPreview() || logo() || selectedFile) {
                        <button
                          type="button"
                          (click)="removeLogo()"
                          class="px-3 py-2 rounded-xl text-xs font-semibold border border-red-300 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        >
                          Quitar
                        </button>
                      }
                    </div>
                    <p class="text-[11px] text-text-muted">JPG, JPEG o PNG hasta 2MB. Se almacenará en Supabase S3 bucket <code>edubid-media</code>.</p>
                  </div>
                </div>

                <!-- URL alternativa opcional -->
                <div class="pt-2 border-t border-border/60">
                  <label class="text-[11px] font-medium text-text-muted">O ingresa una URL directa de la imagen:</label>
                  <input
                    type="url"
                    [ngModel]="logo()"
                    (ngModelChange)="logo.set($event)"
                    name="logo"
                    class="w-full mt-1 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs focus:ring-2 focus:ring-primary text-text font-mono"
                    placeholder="https://ejemplo.com/logo-colegio.png"
                  />
                </div>
              </div>

              <!-- Paletas Sugeridas (Acceso Rápido - 8 Paletas Idénticas a Rector) -->
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

              <!-- Selector de Color Principal (33 Colores + Grises y Contraste Dinámico) -->
              <div class="space-y-3 pt-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <label class="text-xs font-semibold text-text-muted uppercase tracking-wide">
                      Color Principal
                    </label>
                    @if (isLightColor(colorPrimario())) {
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        Color Claro: Letras automáticas en Negro
                      </span>
                    }
                  </div>
                  <div class="flex items-center gap-2">
                    <div
                      class="w-5 h-5 rounded-md border border-border shadow-2xs flex-shrink-0"
                      [style.background]="colorPrimario()"
                    ></div>
                    <span class="text-xs font-bold" [style.color]="colorPrimario()">
                      {{ getNombreColor(colorPrimario()) }}
                    </span>
                  </div>
                </div>

                <div class="grid grid-cols-6 sm:grid-cols-10 gap-1.5 p-3 bg-bg rounded-xl border border-border">
                  @for (color of coloresDisponibles; track color.hex) {
                    <button
                      type="button"
                      (click)="seleccionarPrimario(color.hex)"
                      class="relative w-full aspect-square rounded-lg transition-all duration-150 focus:outline-none cursor-pointer group border border-border/60"
                      [style.background]="color.hex"
                      [class.scale-110]="colorPrimario().toLowerCase() === color.hex.toLowerCase()"
                      [class.shadow-md]="colorPrimario().toLowerCase() === color.hex.toLowerCase()"
                      [class.ring-2]="colorPrimario().toLowerCase() === color.hex.toLowerCase()"
                      [class.ring-primary]="colorPrimario().toLowerCase() === color.hex.toLowerCase()"
                      [title]="color.nombre + ' (' + color.hex + ')'"
                    >
                      <span class="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[9px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-md">
                        {{ color.nombre }}
                      </span>
                      @if (colorPrimario().toLowerCase() === color.hex.toLowerCase()) {
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

              <!-- Selector de Color Secundario (33 Colores + Grises y Contraste Dinámico) -->
              <div class="space-y-3 pt-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <label class="text-xs font-semibold text-text-muted uppercase tracking-wide">
                      Color Secundario / Acento
                    </label>
                    @if (isLightColor(colorSecundario())) {
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        Color Claro: Letras automáticas en Negro
                      </span>
                    }
                  </div>
                  <div class="flex items-center gap-2">
                    <div
                      class="w-5 h-5 rounded-md border border-border shadow-2xs flex-shrink-0"
                      [style.background]="colorSecundario()"
                    ></div>
                    <span class="text-xs font-bold" [style.color]="colorSecundario()">
                      {{ getNombreColor(colorSecundario()) }}
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
                      [class.scale-110]="colorSecundario().toLowerCase() === color.hex.toLowerCase()"
                      [class.shadow-md]="colorSecundario().toLowerCase() === color.hex.toLowerCase()"
                      [class.ring-2]="colorSecundario().toLowerCase() === color.hex.toLowerCase()"
                      [class.ring-primary]="colorSecundario().toLowerCase() === color.hex.toLowerCase()"
                      [title]="color.nombre + ' (' + color.hex + ')'"
                    >
                      <span class="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[9px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-md">
                        {{ color.nombre }}
                      </span>
                      @if (colorSecundario().toLowerCase() === color.hex.toLowerCase()) {
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

              <!-- Vista Previa de Contraste en Botones (Idéntica a Rector) -->
              <div class="rounded-xl border border-border bg-bg p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold text-text-muted">Vista previa de contraste en botones</p>
                  <span class="text-[11px] text-text-muted font-mono">
                    Texto: {{ isLightColor(colorPrimario()) ? 'Oscuro (#0A0A0A)' : 'Blanco (#FFFFFF)' }}
                  </span>
                </div>

                <div class="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    class="px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs border border-black/10 dark:border-white/10"
                    [style.background]="colorPrimario()"
                    [style.color]="isLightColor(colorPrimario()) ? '#0a0a0a' : '#ffffff'"
                  >
                    Botón Principal
                  </button>
                  <button
                    type="button"
                    class="px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs border border-black/10 dark:border-white/10"
                    [style.background]="colorSecundario()"
                    [style.color]="isLightColor(colorSecundario()) ? '#0a0a0a' : '#ffffff'"
                  >
                    Botón Secundario
                  </button>
                  <div class="flex items-center gap-2 text-xs text-text-muted">
                    <span class="font-medium">{{ getNombreColor(colorPrimario()) }}</span>
                    <span>+</span>
                    <span class="font-medium">{{ getNombreColor(colorSecundario()) }}</span>
                  </div>
                </div>
              </div>

              <!-- Botones de Acción al Pie del Formulario -->
              <div class="pt-5 border-t border-border flex items-center justify-end gap-3">
                <a
                  routerLink="/dashboard"
                  class="px-5 py-2.5 rounded-xl text-xs font-semibold text-text-muted hover:text-text border border-border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </a>

                <button
                  type="submit"
                  [disabled]="isSaving() || !nombre().trim()"
                  class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-black/10 dark:border-white/10"
                  [style.background]="isSaving() ? '#6b7280' : colorPrimario()"
                  [style.color]="isLightColor(colorPrimario()) ? '#0a0a0a' : '#ffffff'"
                >
                  @if (isSaving()) {
                    <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Registrando institución...</span>
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Crear Institución</span>
                  }
                </button>
              </div>

            </form>
          </div>
        </div>

        <!-- Columna Derecha: Vista Previa en Vivo (Sticky Mockup) -->
        <div class="space-y-4">
          <div class="p-5 rounded-2xl border border-border bg-surface space-y-4 sticky top-20 shadow-xs">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Vista Previa en Vivo
              </h4>
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <p class="text-[11px] text-text-muted">
              Así verán la interfaz los rectores, docentes y estudiantes de este nuevo colegio:
            </p>

            <!-- Mockup de Tarjeta Institucional -->
            <div class="rounded-xl border border-border bg-bg p-4 space-y-4 shadow-2xs overflow-hidden relative">
              
              <!-- Barra Superior Simulada -->
              <div class="flex items-center justify-between pb-3 border-b border-border">
                <div class="flex items-center gap-2 min-w-0">
                  @if (logoPreview() || logo()) {
                    <img [src]="logoPreview() || logo()" alt="Preview" class="w-6 h-6 rounded-md object-contain" />
                  } @else {
                    <div
                      class="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px]"
                      [style.backgroundColor]="colorPrimario()"
                      [style.color]="isLightColor(colorPrimario()) ? '#0a0a0a' : '#ffffff'"
                    >
                      {{ (nombre() || 'EB').slice(0, 2).toUpperCase() }}
                    </div>
                  }
                  <span class="text-xs font-extrabold truncate" [style.color]="colorPrimario()">
                    {{ nombre() || 'Nombre Institución' }}
                  </span>
                </div>

                <span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold" [style.backgroundColor]="colorSecundario()" [style.color]="isLightColor(colorSecundario()) ? '#0a0a0a' : '#ffffff'">
                  PRO
                </span>
              </div>

              <!-- Botones de Acción Simulados -->
              <div class="space-y-2">
                <button
                  type="button"
                  class="w-full py-2 rounded-lg text-xs font-bold shadow-xs transition-opacity"
                  [style.backgroundColor]="colorPrimario()"
                  [style.color]="isLightColor(colorPrimario()) ? '#0a0a0a' : '#ffffff'"
                >
                  Botón Principal Primario
                </button>
                
                <button
                  type="button"
                  class="w-full py-1.5 rounded-lg text-xs font-semibold border transition-opacity"
                  [style.borderColor]="colorSecundario()"
                  [style.color]="colorSecundario()"
                >
                  Acción Secundaria
                </button>
              </div>

              <!-- Resumen de Configuración -->
              <div class="pt-3 border-t border-border/60 space-y-2 text-[11px]">
                <div class="flex items-center justify-between">
                  <span class="text-text-muted">Estado:</span>
                  <span class="font-semibold" [class.text-emerald-500]="activo()" [class.text-amber-500]="!activo()">
                    {{ activo() ? 'Activa' : 'Inactiva' }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-text-muted">Código DANE:</span>
                  <span class="font-mono font-semibold text-text">
                    {{ codigoDane() || 'Sin registrar' }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-text-muted">Colores:</span>
                  <span class="text-text truncate max-w-[150px]">
                    {{ getNombreColor(colorPrimario()) }} / {{ getNombreColor(colorSecundario()) }}
                  </span>
                </div>
              </div>

            </div>

            <!-- Banner Informativo -->
            <div class="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-2.5 text-[11px] text-text-muted">
              <svg class="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Una vez creada, podrás asignar un Rector y transferir estudiantes o docentes desde el panel de administración.</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  `
})
export class CreateInstitutionComponent {
  private router = inject(Router);
  private institutionService = inject(InstitutionService);
  private notificationService = inject(NotificationService);

  nombre = signal<string>('');
  codigoDane = signal<string>('');
  activo = signal<boolean>(true);
  colorPrimario = signal<string>('#ea580c');
  colorSecundario = signal<string>('#3b82f6');
  logo = signal<string>('');
  selectedFile: File | null = null;
  logoPreview = signal<string | null>(null);
  isSaving = signal<boolean>(false);

  // Paleta completa de 33 colores con escala de grises idéntica a rector
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

  // 8 Paletas sugeridas idénticas a rector
  palettes: BrandingPalette[] = [
    { name: 'EduBid Clásico', primary: '#ea580c', secondary: '#3b82f6' },
    { name: 'Monocromo Minimalista', primary: '#18181b', secondary: '#71717a' },
    { name: 'Plata & Grafito', primary: '#ffffff', secondary: '#3f3f46' },
    { name: 'Esmeralda', primary: '#059669', secondary: '#10b981' },
    { name: 'Prestigio', primary: '#7c3aed', secondary: '#a855f7' },
    { name: 'Océano', primary: '#2563eb', secondary: '#06b6d4' },
    { name: 'Rubí', primary: '#dc2626', secondary: '#f97316' },
    { name: 'Dorado', primary: '#d97706', secondary: '#f59e0b' },
  ];

  getNombreColor(hex: string): string {
    if (!hex) return 'Personalizado';
    return this.coloresDisponibles.find(c => c.hex.toLowerCase() === hex.toLowerCase())?.nombre || 'Personalizado';
  }

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

  applyPalette(palette: BrandingPalette): void {
    this.colorPrimario.set(palette.primary);
    this.colorSecundario.set(palette.secondary);
  }

  isCurrentPalette(palette: BrandingPalette): boolean {
    return this.colorPrimario() === palette.primary && this.colorSecundario() === palette.secondary;
  }

  seleccionarPrimario(hex: string): void {
    this.colorPrimario.set(hex);
  }

  seleccionarSecundario(hex: string): void {
    this.colorSecundario.set(hex);
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      this.notificationService.error('Formato no válido. Selecciona un archivo JPG, JPEG o PNG.', 'Archivo');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.notificationService.error('El archivo excede el tamaño máximo de 2MB.', 'Archivo');
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.selectedFile = null;
    this.logoPreview.set(null);
    this.logo.set('');
  }

  saveInstitution(): void {
    if (!this.nombre().trim()) {
      this.notificationService.error('Debes indicar el nombre de la institución.', 'Validación');
      return;
    }

    this.isSaving.set(true);

    const formData = new FormData();
    formData.append('nombre', this.nombre().trim());
    if (this.codigoDane().trim()) {
      formData.append('codigo_dane', this.codigoDane().trim());
    }
    formData.append('activo', String(this.activo()));
    formData.append('color_primario', this.colorPrimario());
    formData.append('color_secundario', this.colorSecundario());

    if (this.selectedFile) {
      formData.append('logo', this.selectedFile);
    } else if (this.logo().trim()) {
      formData.append('logo', this.logo().trim());
    }

    this.institutionService.createInstitution(formData).subscribe({
      next: (created) => {
        this.isSaving.set(false);
        this.notificationService.success(`¡Institución "${created.nombre}" registrada exitosamente!`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error(err);
        const detail = err.error?.detail || err.error?.codigo_dane?.[0] || 'Error al registrar la institución en el sistema.';
        this.notificationService.error(detail, 'Error');
      }
    });
  }
}
