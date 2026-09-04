import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

interface Dot {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  isAccent: boolean;
}

@Component({
  selector: 'app-interactive-dots',
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
export class InteractiveDotsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  private ngZone = inject(NgZone);
  private themeService = inject(ThemeService);

  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private dots: Dot[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;

  // Mouse interaction state
  private mouse = {
    x: -9999,
    y: -9999,
    radius: 170,
    active: false,
  };

  private boundOnMouseMove = this.onMouseMove.bind(this);
  private boundOnMouseLeave = this.onMouseLeave.bind(this);
  private boundOnTouchMove = this.onTouchMove.bind(this);
  private boundOnTouchEnd = this.onTouchEnd.bind(this);
  private boundOnResize = this.onResize.bind(this);

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    this.ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!this.ctx) return;

    this.updateDimensions();
    this.initDots();

    // Run animation and listeners OUTSIDE Angular zone to maintain 60fps without change detection
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.boundOnMouseMove, { passive: true });
      window.addEventListener('mouseleave', this.boundOnMouseLeave, { passive: true });
      window.addEventListener('touchmove', this.boundOnTouchMove, { passive: true });
      window.addEventListener('touchend', this.boundOnTouchEnd, { passive: true });
      window.addEventListener('resize', this.boundOnResize, { passive: true });
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

  private initDots(): void {
    this.dots = [];
    // Balanced particle count based on display size
    const count = Math.min(85, Math.max(35, Math.floor((this.width * this.height) / 13000)));

    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.25 + Math.random() * 0.4;

      this.dots.push({
        x,
        y,
        originX: x,
        originY: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.0 + Math.random() * 1.5,
        baseAlpha: 0.5 + Math.random() * 0.35,
        isAccent: i % 4 === 0, // 25% orange accent particles
      });
    }
  }

  private onResize(): void {
    this.updateDimensions();
    this.initDots();
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
    this.mouse.active = true;
  }

  private onMouseLeave(): void {
    this.mouse.x = -9999;
    this.mouse.y = -9999;
    this.mouse.active = false;
  }

  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0) {
      this.mouse.x = event.touches[0].clientX;
      this.mouse.y = event.touches[0].clientY;
      this.mouse.active = true;
    }
  }

  private onTouchEnd(): void {
    this.onMouseLeave();
  }

  private animate = (): void => {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    const isDark =
      this.themeService.isDark() ||
      document.documentElement.classList.contains('dark');

    // High contrast theme palette for clear visibility
    const regularRgb = isDark ? '203, 213, 225' : '71, 85, 105'; // slate-300 dark / slate-600 light
    const accentRgb = isDark ? '251, 146, 60' : '234, 88, 12';   // orange-400 dark / orange-600 light
    const lineRgb = isDark ? '148, 163, 184' : '148, 163, 184';   // slate-400

    const maxDist = 120;
    const mouseRadius = this.mouse.radius;

    // 1. Connect nearby dots with subtle lines
    for (let i = 0; i < this.dots.length; i++) {
      const dotA = this.dots[i];
      for (let j = i + 1; j < this.dots.length; j++) {
        const dotB = this.dots[j];
        const dx = dotA.x - dotB.x;
        const dy = dotA.y - dotB.y;
        const dist = Math.hypot(dx, dy);

        if (dist < maxDist) {
          const lineAlpha = (1 - dist / maxDist) * (isDark ? 0.22 : 0.25);
          this.ctx.beginPath();
          this.ctx.moveTo(dotA.x, dotA.y);
          this.ctx.lineTo(dotB.x, dotB.y);
          this.ctx.strokeStyle = `rgba(${lineRgb}, ${lineAlpha})`;
          this.ctx.lineWidth = 0.85;
          this.ctx.stroke();
        }
      }
    }

    // 2. Update and draw each dot with cursor interaction
    for (let i = 0; i < this.dots.length; i++) {
      const dot = this.dots[i];

      // Subtle float motion
      dot.x += dot.vx;
      dot.y += dot.vy;

      // Soft rebound at viewport edges
      if (dot.x < 0) {
        dot.x = 0;
        dot.vx *= -1;
      } else if (dot.x > this.width) {
        dot.x = this.width;
        dot.vx *= -1;
      }

      if (dot.y < 0) {
        dot.y = 0;
        dot.vy *= -1;
      } else if (dot.y > this.height) {
        dot.y = this.height;
        dot.vy *= -1;
      }

      // Cursor interaction: elastic displacement & glow connection
      let isNearMouse = false;
      let extraAlpha = 0;

      if (this.mouse.active) {
        const dx = dot.x - this.mouse.x;
        const dy = dot.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < mouseRadius && dist > 0) {
          isNearMouse = true;
          const factor = (mouseRadius - dist) / mouseRadius;
          const pushAngle = Math.atan2(dy, dx);
          const pushForce = factor * 2.8;

          dot.x += Math.cos(pushAngle) * pushForce;
          dot.y += Math.sin(pushAngle) * pushForce;
          extraAlpha = factor * 0.5;

          // Draw vibrant magnetic connection line to mouse cursor
          this.ctx.beginPath();
          this.ctx.moveTo(dot.x, dot.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          const mouseLineAlpha = factor * (isDark ? 0.55 : 0.45);
          this.ctx.strokeStyle = `rgba(${accentRgb}, ${mouseLineAlpha})`;
          this.ctx.lineWidth = 1.3;
          this.ctx.stroke();
        }
      }

      // Draw dot
      const color = dot.isAccent ? accentRgb : regularRgb;
      const alpha = Math.min(1, dot.baseAlpha + extraAlpha);
      const drawRadius = dot.radius + (isNearMouse ? 1.5 : 0);

      this.ctx.save();
      if (isNearMouse) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = `rgba(${accentRgb}, 0.8)`;
      }

      this.ctx.beginPath();
      this.ctx.arc(dot.x, dot.y, drawRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${color}, ${alpha})`;
      this.ctx.fill();
      this.ctx.restore();
    }

    this.animId = requestAnimationFrame(this.animate);
  };
}
