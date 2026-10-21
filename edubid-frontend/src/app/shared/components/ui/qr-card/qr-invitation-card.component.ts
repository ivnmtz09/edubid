import { Component, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { generateQrSvg, downloadQrAsPng } from '../../../utils/qr-code.util';

@Component({
  selector: 'app-qr-invitation-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-5 sm:p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-5 transition-all">
      <!-- Encabezado con Rol y Badge -->
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span
              class="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-2xs"
              [style.backgroundColor]="badgeBg()"
              [style.color]="badgeColor()"
              [style.borderColor]="badgeBorder()"
            >
              {{ roleLabel() }}
            </span>
            <span class="text-[11px] text-text-muted font-medium">• Exclusivo</span>
          </div>
          <h4 class="text-base font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {{ title() }}
          </h4>
          <p class="text-xs text-text-muted">
            {{ description() }}
          </p>
        </div>
      </div>

      <!-- Contenedor Central: Código QR Vectorial Nítido -->
      <div class="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/70 border border-border">
        <!-- Contenedor del QR con borde y sombra -->
        <div class="p-3 rounded-2xl bg-white shadow-xs border border-neutral-200 dark:border-neutral-800 shrink-0 flex items-center justify-center">
          <div [innerHTML]="qrSvgSafe()" class="w-36 h-36 flex items-center justify-center"></div>
        </div>

        <!-- Instrucciones y Acciones Rápidas -->
        <div class="space-y-3 grow w-full">
          <div class="space-y-1 text-xs">
            <span class="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Escaneo con Cámara o WhatsApp
            </span>
            <p class="text-text-muted leading-relaxed text-[11px]">
              El usuario puede escanear este código QR directamente desde su celular para ingresar al registro exclusivo de <strong>{{ institutionName() }}</strong>.
            </p>
          </div>

          <!-- Botón de Descargar QR PNG -->
          <button
            type="button"
            (click)="downloadQr()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text transition-colors cursor-pointer shadow-2xs"
            title="Descargar código QR en formato PNG"
          >
            <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Descargar Código QR (PNG)</span>
          </button>
        </div>
      </div>

      <!-- Barra de Enlace y Botón Copiar -->
      <div class="space-y-1.5">
        <label class="text-[11px] font-bold uppercase tracking-wider text-text-muted">
          Enlace Exclusivo de Registro
        </label>
        <div class="flex items-center gap-2">
          <input
            type="text"
            readonly
            [value]="fullUrl()"
            class="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-xs font-mono text-text select-all focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
          <button
            type="button"
            (click)="copyLink()"
            class="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            [class.bg-emerald-600]="isCopied()"
            [class.text-white]="isCopied()"
            [class.bg-primary]="!isCopied()"
            [class.text-white]="!isCopied()"
            [class.hover:opacity-90]="!isCopied()"
          >
            @if (isCopied()) {
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>¡Copiado!</span>
            } @else {
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>Copiar Enlace</span>
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class QrInvitationCardComponent {
  readonly role = input.required<'rector' | 'coordinador' | 'docente' | 'estudiante'>();
  readonly roleLabel = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly institutionName = input.required<string>();
  readonly institutionSlug = input.required<string>();
  readonly routePath = input.required<string>();
  readonly primaryColor = input<string>('#ea580c');

  private sanitizer = inject(DomSanitizer);

  isCopied = signal(false);

  fullUrl = computed(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://edubid.app';
    return `${origin}/institucion/${this.institutionSlug()}/${this.routePath()}`;
  });

  rawSvg = computed(() => {
    return generateQrSvg(this.fullUrl(), {
      size: 144,
      color: this.primaryColor() || '#0f172a',
      bgColor: '#ffffff',
      margin: 2
    });
  });

  qrSvgSafe = computed<SafeHtml>(() => {
    return this.sanitizer.bypassSecurityTrustHtml(this.rawSvg());
  });

  badgeBg = computed(() => {
    switch (this.role()) {
      case 'rector': return 'rgba(234, 88, 12, 0.12)';
      case 'coordinador': return 'rgba(6, 182, 212, 0.12)';
      case 'docente': return 'rgba(245, 158, 11, 0.12)';
      default: return 'rgba(16, 185, 129, 0.12)';
    }
  });

  badgeColor = computed(() => {
    switch (this.role()) {
      case 'rector': return '#ea580c';
      case 'coordinador': return '#0891b2';
      case 'docente': return '#d97706';
      default: return '#059669';
    }
  });

  badgeBorder = computed(() => {
    switch (this.role()) {
      case 'rector': return 'rgba(234, 88, 12, 0.25)';
      case 'coordinador': return 'rgba(6, 182, 212, 0.25)';
      case 'docente': return 'rgba(245, 158, 11, 0.25)';
      default: return 'rgba(16, 185, 129, 0.25)';
    }
  });

  copyLink(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.fullUrl()).then(() => {
        this.isCopied.set(true);
        setTimeout(() => this.isCopied.set(false), 2200);
      });
    }
  }

  downloadQr(): void {
    const filename = `QR_${this.institutionSlug()}_${this.role()}.png`;
    downloadQrAsPng(this.rawSvg(), filename, 640);
  }
}
