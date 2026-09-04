import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, Event } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Top Progress Line (Fija en el borde superior del viewport) -->
    <div
      class="fixed top-0 left-0 right-0 z-50 h-[3px] pointer-events-none overflow-hidden transition-opacity duration-300"
      [class.opacity-100]="visible()"
      [class.opacity-0]="!visible()"
    >
      <div
        class="h-full bg-slate-900 dark:bg-white shadow-[0_0_8px_rgba(234,88,12,0.3)] transition-[width] duration-200 ease-out"
        [style.width.%]="progress()"
      ></div>
    </div>

    <!-- Loading Page Overlay (Transición cinematográfica suave) -->
    @if (visible()) {
      <div
        class="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg/85 backdrop-blur-md transition-opacity duration-300 pointer-events-auto"
        [class.opacity-100]="opacityOn()"
        [class.opacity-0]="!opacityOn()"
      >
        <div class="flex flex-col items-center justify-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <!-- Icono Central con Spinner Orbital Minimalista -->
          <div class="relative flex items-center justify-center w-20 h-20">
            <!-- Spinner Ring Orbitante -->
            <div
              class="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-white animate-spin"
            ></div>

            <!-- Icono EduBid Centrado -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              class="w-10 h-10 transition-transform duration-300 group-hover:scale-105"
            >
              <circle cx="32" cy="32" r="23" fill="none" class="stroke-slate-400 dark:stroke-slate-500" stroke-width="1.8" stroke-dasharray="3 2"/>
              <polygon points="32,15 17,22 32,29 47,22" class="fill-slate-900 dark:fill-white"/>
              <path d="M 23 25.5 L 23 29 Q 32 34 41 29 L 41 25.5" fill="none" class="stroke-slate-500 dark:stroke-slate-400" stroke-width="1.6"/>
              <circle cx="45" cy="28" r="2.5" fill="#ea580c"/>
              <line x1="20" y1="48" x2="44" y2="48" class="stroke-slate-400 dark:stroke-slate-600" stroke-width="2" stroke-linecap="round"/>
              <rect x="23" y="33" width="18" height="6" rx="2" class="fill-slate-900 dark:fill-white"/>
              <rect x="30.5" y="33" width="3" height="6" fill="#ea580c"/>
              <line x1="32" y1="39" x2="32" y2="45" class="stroke-slate-500 dark:stroke-slate-400" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>

          <!-- Micro Barra y Texto de Estado -->
          <div class="flex flex-col items-center space-y-2">
            <span class="text-xs font-semibold tracking-wider text-text-muted uppercase">
              Cargando EduBid...
            </span>
            <div class="w-28 h-1 bg-border rounded-full overflow-hidden">
              <div
                class="h-full bg-slate-900 dark:bg-white transition-[width] duration-200 ease-out"
                [style.width.%]="progress()"
              ></div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class LoadingScreenComponent implements OnDestroy {
  private router = inject(Router);
  private routerSub: Subscription;
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  visible = signal(false);
  opacityOn = signal(false);
  progress = signal(0);

  constructor() {
    this.routerSub = this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        this.startLoading();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.finishLoading();
      }
    });
  }

  private startLoading(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    this.visible.set(true);
    this.opacityOn.set(true);
    this.progress.set(20);

    // Incremento gradual para emular carga suave
    this.progressInterval = setInterval(() => {
      this.progress.update((p) => {
        if (p < 85) {
          return p + Math.floor(Math.random() * 12) + 5;
        }
        return p;
      });
    }, 120);
  }

  private finishLoading(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    this.progress.set(100);

    // Desplazamiento instantáneo hacia arriba
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // Retardo suave para apreciar la barra al 100% y desvanecer
    setTimeout(() => {
      this.opacityOn.set(false);
      setTimeout(() => {
        this.visible.set(false);
        this.progress.set(0);
      }, 250);
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }
}
