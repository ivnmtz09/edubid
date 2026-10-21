import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  inject,
  ChangeDetectionStrategy,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface WaveConfig {
  baseYRatio: number;
  amp: number;
  freq: number;
  speed: number;
  phase: number;
  harmonicAmp: number;
  harmonicFreq: number;
  harmonicSpeed: number;
  harmonicPhase: number;
  breathOffset: number;
  breathSpeed: number;
  mouseWeight: number;
  parallaxFactor: number;
  cursorLag: number;
  primaryWeight: number;
  darkStroke: string;
  darkGlow: string;
  darkFillTop: string;
  lightStroke: string;
  lightGlow: string;
  lightFillTop: string;
  // Coordenadas con retardo (lag/easing offset) individual por capa
  currentCursorX: number;
  currentCursorY: number;
}

@Component({
  selector: 'app-interactive-waves',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas
      #canvas
      class="fixed inset-0 pointer-events-none z-0 w-full h-full block"
      aria-hidden="true"
    ></canvas>
  `,
  styles: [
    `
      :host {
        display: block;
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteractiveWavesComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() primaryColor?: string;
  @Input() secondaryColor?: string;

  private ngZone = inject(NgZone);
  private themeService = inject(ThemeService);

  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private width = 0;
  private height = 0;
  private dpr = 1;

  // Tiempo acumulado para ondulación y respiración orgánica continua
  private time = 0;

  // Estado del cursor (objetivo vs interpolación)
  private targetCursor = {
    x: -9999,
    y: -9999,
  };

  private isMouseActive = false;
  private cursorIntensity = 0;

  // Parallax por scroll con suavizado
  private targetScrollY = 0;
  private smoothScrollY = 0;

  // Colores cacheados para actualización reactiva en caliente
  private lastPrimaryHex = '';
  private lastSecondaryHex = '';

  // 7 capas armónicas que cubren todo el fondo (0% a 100% de la altura)
  private waves: WaveConfig[] = [];

  private boundOnMouseMove = this.onMouseMove.bind(this);
  private boundOnMouseLeave = this.onMouseLeave.bind(this);
  private boundOnTouchMove = this.onTouchMove.bind(this);
  private boundOnTouchEnd = this.onTouchEnd.bind(this);
  private boundOnResize = this.onResize.bind(this);
  private boundOnScroll = this.onScroll.bind(this);

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    this.ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!this.ctx) return;

    this.updateDimensions();
    this.targetScrollY = window.scrollY || 0;
    this.smoothScrollY = this.targetScrollY;
    this.initWaves();

    // Loop de animación a 60 FPS fuera de la zona de Angular
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.boundOnMouseMove, { passive: true });
      window.addEventListener('mouseleave', this.boundOnMouseLeave, { passive: true });
      window.addEventListener('touchmove', this.boundOnTouchMove, { passive: true });
      window.addEventListener('touchend', this.boundOnTouchEnd, { passive: true });
      window.addEventListener('resize', this.boundOnResize, { passive: true });
      window.addEventListener('scroll', this.boundOnScroll, { passive: true });
      this.animate();
    });
  }

  ngOnDestroy(): void {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.boundOnMouseMove);
      window.removeEventListener('mouseleave', this.boundOnMouseLeave);
      window.removeEventListener('touchmove', this.boundOnTouchMove);
      window.removeEventListener('touchend', this.boundOnTouchEnd);
      window.removeEventListener('resize', this.boundOnResize);
      window.removeEventListener('scroll', this.boundOnScroll);
    }
  }

  private updateDimensions(): void {
    const canvas = this.canvasRef.nativeElement;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = this.width * this.dpr;
    canvas.height = this.height * this.dpr;
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;

    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);
    }
  }

  private onScroll(): void {
    this.targetScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  }

  private resolveBrandColors(): { primary: RgbColor; secondary: RgbColor } {
    let primStr = this.primaryColor;
    let secStr = this.secondaryColor;

    if (typeof window !== 'undefined' && (!primStr || !secStr)) {
      const rootStyle = getComputedStyle(document.documentElement);
      if (!primStr) {
        primStr = rootStyle.getPropertyValue('--brand-primary').trim() || '#ea580c';
      }
      if (!secStr) {
        secStr = rootStyle.getPropertyValue('--brand-accent').trim() || '#3b82f6';
      }
    }

    const primary = this.parseColorToRgb(primStr || '#ea580c');
    const secondary = this.parseColorToRgb(secStr || '#3b82f6');

    return { primary, secondary };
  }

  private parseColorToRgb(color: string): RgbColor {
    const trimmed = color.trim().toLowerCase();

    if (trimmed.startsWith('#')) {
      const hex = trimmed.slice(1);
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16) || 234,
          g: parseInt(hex[1] + hex[1], 16) || 88,
          b: parseInt(hex[2] + hex[2], 16) || 12,
        };
      }
      if (hex.length >= 6) {
        return {
          r: parseInt(hex.substring(0, 2), 16) || 234,
          g: parseInt(hex.substring(2, 4), 16) || 88,
          b: parseInt(hex.substring(4, 6), 16) || 12,
        };
      }
    }

    const rgbMatch = trimmed.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10),
      };
    }

    return { r: 234, g: 88, b: 12 };
  }

  private lerpRgb(c1: RgbColor, c2: RgbColor, factor: number): RgbColor {
    return {
      r: Math.round(c1.r + (c2.r - c1.r) * factor),
      g: Math.round(c1.g + (c2.g - c1.g) * factor),
      b: Math.round(c1.b + (c2.b - c1.b) * factor),
    };
  }

  /**
   * Inicializa 7 capas de ondas distribuidas en toda la altura de la pantalla (14% a 98%),
   * con configuraciones individuales de lag/retardo para el cursor, respiración orgánica y parallax.
   */
  private initWaves(): void {
    const { primary, secondary } = this.resolveBrandColors();
    this.lastPrimaryHex = `${primary.r},${primary.g},${primary.b}`;
    this.lastSecondaryHex = `${secondary.r},${secondary.g},${secondary.b}`;

    // Distribución a lo largo de todo el viewport
    const waveDefs = [
      // Capa 1: Región superior / Navbar y Titular principal
      {
        baseYRatio: 0.14,
        amp: 28,
        freq: 0.0016,
        speed: 0.009,
        harmonicAmp: 10,
        harmonicFreq: 0.0036,
        harmonicSpeed: 0.012,
        harmonicPhase: 0.4,
        breathOffset: 0.0,
        breathSpeed: 0.8,
        mouseWeight: 0.7,
        parallaxFactor: 0.08,
        cursorLag: 0.075, // Reacción más rápida
        primaryWeight: 1.0, // Tono primario puro
      },
      // Capa 2: Región superior-media / Subtítulo y encabezados
      {
        baseYRatio: 0.28,
        amp: 36,
        freq: 0.0019,
        speed: -0.007,
        harmonicAmp: 13,
        harmonicFreq: 0.0040,
        harmonicSpeed: -0.010,
        harmonicPhase: 1.1,
        breathOffset: 0.9,
        breathSpeed: 0.9,
        mouseWeight: 0.85,
        parallaxFactor: 0.14,
        cursorLag: 0.062,
        primaryWeight: 0.85,
      },
      // Capa 3: Región media / Detrás de tarjetas y botones de acceso
      {
        baseYRatio: 0.44,
        amp: 42,
        freq: 0.0017,
        speed: 0.008,
        harmonicAmp: 16,
        harmonicFreq: 0.0034,
        harmonicSpeed: 0.011,
        harmonicPhase: 2.3,
        breathOffset: 1.8,
        breathSpeed: 0.75,
        mouseWeight: 1.05,
        parallaxFactor: 0.22,
        cursorLag: 0.050,
        primaryWeight: 0.68,
      },
      // Capa 4: Región central-baja / Base de carrusel y llamadas a la acción
      {
        baseYRatio: 0.58,
        amp: 48,
        freq: 0.0015,
        speed: -0.006,
        harmonicAmp: 18,
        harmonicFreq: 0.0031,
        harmonicSpeed: -0.009,
        harmonicPhase: 0.8,
        breathOffset: 2.7,
        breathSpeed: 0.85,
        mouseWeight: 1.15,
        parallaxFactor: 0.30,
        cursorLag: 0.040,
        primaryWeight: 0.50, // Fusión cromática equilibrada
      },
      // Capa 5: Transición a sección de características
      {
        baseYRatio: 0.72,
        amp: 40,
        freq: 0.0021,
        speed: 0.010,
        harmonicAmp: 14,
        harmonicFreq: 0.0044,
        harmonicSpeed: 0.014,
        harmonicPhase: 3.5,
        breathOffset: 3.6,
        breathSpeed: 0.7,
        mouseWeight: 0.95,
        parallaxFactor: 0.38,
        cursorLag: 0.032,
        primaryWeight: 0.32,
      },
      // Capa 6: Sección inferior de contenidos
      {
        baseYRatio: 0.86,
        amp: 34,
        freq: 0.0018,
        speed: -0.007,
        harmonicAmp: 12,
        harmonicFreq: 0.0038,
        harmonicSpeed: -0.011,
        harmonicPhase: 1.9,
        breathOffset: 4.5,
        breathSpeed: 0.9,
        mouseWeight: 0.8,
        parallaxFactor: 0.46,
        cursorLag: 0.024,
        primaryWeight: 0.15,
      },
      // Capa 7: Base profunda y pie de página
      {
        baseYRatio: 0.98,
        amp: 28,
        freq: 0.0024,
        speed: 0.008,
        harmonicAmp: 10,
        harmonicFreq: 0.0050,
        harmonicSpeed: 0.012,
        harmonicPhase: 4.8,
        breathOffset: 5.4,
        breathSpeed: 0.8,
        mouseWeight: 0.65,
        parallaxFactor: 0.54,
        cursorLag: 0.018, // Movimiento con mayor inercia/arrastre
        primaryWeight: 0.0, // Tono secundario puro
      },
    ];

    this.waves = waveDefs.map((def, idx) => {
      const color = this.lerpRgb(secondary, primary, def.primaryWeight);
      const rgbStr = `${color.r}, ${color.g}, ${color.b}`;

      return {
        baseYRatio: def.baseYRatio,
        amp: def.amp,
        freq: def.freq,
        speed: def.speed,
        phase: (idx * Math.PI * 0.38),
        harmonicAmp: def.harmonicAmp,
        harmonicFreq: def.harmonicFreq,
        harmonicSpeed: def.harmonicSpeed,
        harmonicPhase: def.harmonicPhase,
        breathOffset: def.breathOffset,
        breathSpeed: def.breathSpeed,
        mouseWeight: def.mouseWeight,
        parallaxFactor: def.parallaxFactor,
        cursorLag: def.cursorLag,
        primaryWeight: def.primaryWeight,
        // Colores tenues, etéreos y no invasivos:
        // Modo oscuro: Trazos sutiles (0.28) y rellenos casi transparentes (0.035)
        darkStroke: `rgba(${rgbStr}, 0.28)`,
        darkGlow: `rgba(${rgbStr}, 0.20)`,
        darkFillTop: `rgba(${rgbStr}, 0.035)`,
        // Modo claro: Trazos acuarela ligeros (0.13) y degradados sutiles (0.018)
        lightStroke: `rgba(${rgbStr}, 0.13)`,
        lightGlow: `rgba(${rgbStr}, 0.08)`,
        lightFillTop: `rgba(${rgbStr}, 0.018)`,
        currentCursorX: this.width * 0.5,
        currentCursorY: this.height * def.baseYRatio,
      };
    });
  }

  private updateWaveColorsIfNeeded(): void {
    const { primary, secondary } = this.resolveBrandColors();
    const currP = `${primary.r},${primary.g},${primary.b}`;
    const currS = `${secondary.r},${secondary.g},${secondary.b}`;

    if (currP === this.lastPrimaryHex && currS === this.lastSecondaryHex) {
      return;
    }

    this.lastPrimaryHex = currP;
    this.lastSecondaryHex = currS;

    for (const wave of this.waves) {
      const color = this.lerpRgb(secondary, primary, wave.primaryWeight);
      const rgbStr = `${color.r}, ${color.g}, ${color.b}`;
      wave.darkStroke = `rgba(${rgbStr}, 0.28)`;
      wave.darkGlow = `rgba(${rgbStr}, 0.20)`;
      wave.darkFillTop = `rgba(${rgbStr}, 0.035)`;
      wave.lightStroke = `rgba(${rgbStr}, 0.13)`;
      wave.lightGlow = `rgba(${rgbStr}, 0.08)`;
      wave.lightFillTop = `rgba(${rgbStr}, 0.018)`;
    }
  }

  private onResize(): void {
    this.updateDimensions();
  }

  private onMouseMove(event: MouseEvent): void {
    this.targetCursor.x = event.clientX;
    this.targetCursor.y = event.clientY;
    this.isMouseActive = true;
  }

  private onMouseLeave(): void {
    this.isMouseActive = false;
  }

  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0) {
      this.targetCursor.x = event.touches[0].clientX;
      this.targetCursor.y = event.touches[0].clientY;
      this.isMouseActive = true;
    }
  }

  private onTouchEnd(): void {
    this.onMouseLeave();
  }

  private animate = (): void => {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.updateWaveColorsIfNeeded();

    const isDark =
      this.themeService.isDark() ||
      document.documentElement.classList.contains('dark');

    // Tiempo acumulado para la respiración continua (sitio vivo sin ser estático)
    this.time += 0.012;

    // 1. Suavizado del Scroll Parallax
    this.smoothScrollY += (this.targetScrollY - this.smoothScrollY) * 0.07;

    // 2. Transición suave de la intensidad de interacción
    const targetIntensity = this.isMouseActive ? 1.0 : 0.0;
    this.cursorIntensity += (targetIntensity - this.cursorIntensity) * 0.04;

    const step = 12; // Paso equilibrado para máxima fluidez a 60 FPS
    const influenceRadius = 380; // Radio amplio y fluido

    // Posición por defecto del cursor si no hay interacción directa
    const defaultX = this.width * 0.5;

    // 3. Renderizado de cada una de las 7 capas con retardos individuales (delay/easing offset)
    for (const wave of this.waves) {
      wave.phase += wave.speed;
      wave.harmonicPhase += wave.harmonicSpeed;

      // Retardo de cursor individual por capa (efecto estela / arrastre líquido)
      const targetLayerX = this.isMouseActive ? this.targetCursor.x : defaultX;
      const targetLayerY = this.isMouseActive ? this.targetCursor.y : this.height * wave.baseYRatio;

      wave.currentCursorX += (targetLayerX - wave.currentCursorX) * wave.cursorLag;
      wave.currentCursorY += (targetLayerY - wave.currentCursorY) * wave.cursorLag;

      // Parallax vertical según profundidad de la capa
      const scrollParallaxOffset = this.smoothScrollY * wave.parallaxFactor * 0.28;
      const baseY = this.height * wave.baseYRatio - scrollParallaxOffset;

      // Respiración armónica sutil continua
      const breath = Math.sin(this.time * wave.breathSpeed + wave.breathOffset);
      const currentAmp = wave.amp * (1 + breath * 0.15);
      const currentHarmonicAmp = wave.harmonicAmp * (1 + breath * 0.12);

      const strokeColor = isDark ? wave.darkStroke : wave.lightStroke;
      const glowColor = isDark ? wave.darkGlow : wave.lightGlow;
      const fillTopColor = isDark ? wave.darkFillTop : wave.lightFillTop;

      this.ctx.beginPath();
      this.ctx.moveTo(0, this.height);

      const points: { x: number; y: number }[] = [];

      for (let x = 0; x <= this.width + step; x += step) {
        // Onda viajera principal + armónico secundario
        let y =
          baseY +
          Math.sin(x * wave.freq + wave.phase) * currentAmp +
          Math.sin(x * wave.harmonicFreq + wave.harmonicPhase) * currentHarmonicAmp;

        // Reacción al cursor con el retardo específico de esta capa
        if (this.cursorIntensity > 0.005) {
          const dx = x - wave.currentCursorX;
          const dist = Math.abs(dx);
          if (dist < influenceRadius) {
            const norm = dist / influenceRadius;
            // Campana de Gauss suave (coseno al cuadrado)
            const bell = Math.cos(norm * (Math.PI * 0.5)) ** 2;

            // Desplazamiento vertical tenue hacia el cursor
            const verticalPull = (wave.currentCursorY - baseY) * 0.20;

            // Ondulación líquida armónica suave
            const fluidRipple = Math.sin(dx * 0.012 - wave.phase * 0.7) * 3.2;

            const perturbation =
              (verticalPull + fluidRipple) *
              bell *
              wave.mouseWeight *
              this.cursorIntensity;

            y += perturbation;
          }
        }

        points.push({ x, y });
      }

      // Relleno poligonal con gradiente ultra tenue
      this.ctx.lineTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y);
      }
      this.ctx.lineTo(this.width, this.height + 25);
      this.ctx.lineTo(0, this.height + 25);
      this.ctx.closePath();

      // Degradado vertical muy tenue que se desvanece
      const fillGrad = this.ctx.createLinearGradient(0, baseY - currentAmp, 0, this.height);
      fillGrad.addColorStop(0, fillTopColor);
      fillGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = fillGrad;
      this.ctx.fill();

      // Trazo de cresta sutil y elegante
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y);
      }
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = isDark ? 1.5 : 1.2;
      this.ctx.shadowBlur = isDark ? 8 : 2;
      this.ctx.shadowColor = glowColor;
      this.ctx.stroke();
      this.ctx.restore();
    }

    this.animId = requestAnimationFrame(this.animate);
  };
}
