import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SoundService } from '../../../core/services/sound.service';

@Component({
  selector: 'app-bot-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative flex items-center justify-end select-none">
      <!-- Hitbox estática: El botón mantiene tamaño y posición fija para evitar saltos o jitter -->
      <button
        #avatarContainer
        type="button"
        (click)="onClickAvatar($event)"
        (mouseenter)="onMouseEnter()"
        (mouseleave)="onMouseLeave()"
        class="group relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-4 focus:ring-amber-500/30 rounded-full"
        aria-label="Asistente EDUBID IA"
      >
        <!-- Resplandor exterior cálido / Aura dorada -->
        <div
          class="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 opacity-60 blur-md group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          [class.opacity-95]="isNear() || isOpen"
          [class.animate-pulse]="isOpen"
        ></div>

        <!-- DISCO MONEDA CHIBI KAWAII MINIMALISTA -->
        <div
          class="relative w-full h-full rounded-full transition-all duration-150"
          [style.transform]="getCoinTransform()"
          [class.scale-95]="isPressed()"
        >
          <!-- Moneda dorada limpia con relieve sutil -->
          <div
            class="relative w-full h-full rounded-full p-1 bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 shadow-xl border-2 border-yellow-200/90 flex items-center justify-center overflow-hidden"
          >
            <!-- Superficie de la carita chibi: amarilla cálida, limpia y uniforme -->
            <div
              class="relative w-full h-full rounded-full bg-gradient-to-b from-amber-100 via-yellow-200 to-amber-300 flex flex-col items-center justify-center overflow-hidden shadow-inner px-2 py-1"
            >
              <!-- Sutil brillo suave superior -->
              <div
                class="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-full pointer-events-none"
              ></div>

              <!-- OJOS CHIBI KAWAII (limpios, redondos y expresivos) -->
              <div class="relative flex items-center justify-center gap-3 w-full mt-1 z-10">
                <!-- Ojo Izquierdo -->
                <div
                  class="relative w-3.5 h-4 flex items-center justify-center transition-all duration-100"
                  [style.transform]="getLeftEyeTransform()"
                >
                  @if (isHovered() || isHappy()) {
                    <!-- Ojito feliz ^ en hover -->
                    <div class="w-3.5 h-2 border-t-[2.5px] border-slate-900 rounded-t-full mt-1"></div>
                  } @else {
                    <!-- Ojo negro circular limpio con brillo blanco simple -->
                    <div
                      class="relative w-3.5 h-3.5 rounded-full bg-slate-900 shadow-xs overflow-hidden transition-transform duration-75"
                      [style.transform]="'translate(' + pupilOffsetX() + 'px, ' + pupilOffsetY() + 'px)'"
                    >
                      <div class="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-white pointer-events-none"></div>
                    </div>
                  }
                </div>

                <!-- Ojo Derecho -->
                <div
                  class="relative w-3.5 h-4 flex items-center justify-center transition-all duration-100"
                  [style.transform]="getRightEyeTransform()"
                >
                  @if (isWinking()) {
                    <!-- Guiño en clic -->
                    <div class="w-3.5 h-1 border-b-[2.5px] border-slate-900 rounded-b-full mt-1"></div>
                  } @else if (isHovered() || isHappy()) {
                    <!-- Ojito feliz ^ en hover -->
                    <div class="w-3.5 h-2 border-t-[2.5px] border-slate-900 rounded-t-full mt-1"></div>
                  } @else {
                    <!-- Ojo negro circular limpio con brillo blanco simple -->
                    <div
                      class="relative w-3.5 h-3.5 rounded-full bg-slate-900 shadow-xs overflow-hidden transition-transform duration-75"
                      [style.transform]="'translate(' + pupilOffsetX() + 'px, ' + pupilOffsetY() + 'px)'"
                    >
                      <div class="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-white pointer-events-none"></div>
                    </div>
                  }
                </div>
              </div>

              <!-- BOQUITA TIERNA MINIMALISTA -->
              <div class="relative mt-1 flex justify-center items-center z-10">
                @if (isOpen) {
                  <div class="w-2.5 h-1.5 rounded-b-full bg-rose-500 border border-slate-900/40"></div>
                } @else if (isWinking() || isHovered()) {
                  <div class="w-2.5 h-1.5 rounded-b-full bg-rose-500/90 border border-slate-900/50"></div>
                } @else {
                  <div class="w-2 h-0.5 border-b-[1.5px] border-slate-800 rounded-b-full"></div>
                }
              </div>
            </div>

            <!-- LED de estado discreto -->
            <span
              class="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white bg-emerald-400"
              [class.animate-pulse]="isOpen"
              title="EDUBID IA Activo"
            ></span>
          </div>
        </div>
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class BotAvatarComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() avatarClick = new EventEmitter<void>();

  private ngZone = inject(NgZone);
  private soundService = inject(SoundService, { optional: true });
  private el = inject(ElementRef);

  pupilOffsetX = signal(0);
  pupilOffsetY = signal(0);
  coinTiltX = signal(0);
  coinTiltY = signal(0);

  isNear = signal(false);
  isHovered = signal(false);
  isBlinking = signal(false);
  isWinking = signal(false);
  isPressed = signal(false);
  isHappy = signal(false);
  isSpinning = signal(false);

  private animationFrameId: number | null = null;
  private blinkTimer: any = null;
  private mouseMoveListener: ((e: MouseEvent) => void) | null = null;

  private targetPupilX = 0;
  private targetPupilY = 0;
  private targetTiltX = 0;
  private targetTiltY = 0;

  private isTouchDevice = false;

  // Parámetros de Histéresis: Buffer de 60px para impedir bucles de oscilación en la frontera
  private readonly ENTER_PROXIMITY_PX = 200;
  private readonly EXIT_PROXIMITY_PX = 260;

  ngOnInit(): void {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    } else {
      this.isTouchDevice = false;
    }

    if (!this.isTouchDevice) {
      this.ngZone.runOutsideAngular(() => {
        this.mouseMoveListener = (e: MouseEvent) => this.onMouseMove(e);
        window.addEventListener('mousemove', this.mouseMoveListener, { passive: true });
        this.startRenderLoop();
      });
    }

    this.startBlinkInterval();
  }

  ngOnDestroy(): void {
    if (this.mouseMoveListener) {
      window.removeEventListener('mousemove', this.mouseMoveListener);
    }
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.blinkTimer) {
      clearInterval(this.blinkTimer);
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const el = this.el.nativeElement.querySelector('button');
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const botCenterX = rect.left + rect.width / 2;
    const botCenterY = rect.top + rect.height / 2;

    const deltaX = e.clientX - botCenterX;
    const deltaY = e.clientY - botCenterY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Algoritmo de Histéresis robusto: activa a < 200px, pero solo desactiva a > 260px
    const currentNear = this.isNear();
    if (!currentNear && distance < this.ENTER_PROXIMITY_PX) {
      this.ngZone.run(() => {
        this.isNear.set(true);
      });
    } else if (currentNear && distance > this.EXIT_PROXIMITY_PX) {
      this.ngZone.run(() => {
        this.isNear.set(false);
      });
    }

    // Cálculo del ángulo hacia el cursor
    const angle = Math.atan2(deltaY, deltaX);

    // Desplazamiento máximo de las pupilas (3.2px de rango)
    const maxPupilDist = 3.2;
    const factor = Math.min(distance / 120, 1);
    this.targetPupilX = Math.cos(angle) * maxPupilDist * factor;
    this.targetPupilY = Math.sin(angle) * maxPupilDist * factor;

    // Inclinación 3D de la moneda (máx 10 grados)
    const maxTilt = 10;
    this.targetTiltX = (-(deltaY / window.innerHeight) * maxTilt).toFixed(2) as any;
    this.targetTiltY = ((deltaX / window.innerWidth) * maxTilt).toFixed(2) as any;
  }

  private startRenderLoop(): void {
    const render = () => {
      const curX = this.pupilOffsetX();
      const curY = this.pupilOffsetY();
      const newX = curX + (this.targetPupilX - curX) * 0.25;
      const newY = curY + (this.targetPupilY - curY) * 0.25;

      const curTiltX = this.coinTiltX();
      const curTiltY = this.coinTiltY();
      const newTiltX = curTiltX + (this.targetTiltX - curTiltX) * 0.15;
      const newTiltY = curTiltY + (this.targetTiltY - curTiltY) * 0.15;

      if (
        Math.abs(newX - curX) > 0.05 ||
        Math.abs(newY - curY) > 0.05 ||
        Math.abs(newTiltX - curTiltX) > 0.05 ||
        Math.abs(newTiltY - curTiltY) > 0.05
      ) {
        this.ngZone.run(() => {
          this.pupilOffsetX.set(Number(newX.toFixed(2)));
          this.pupilOffsetY.set(Number(newY.toFixed(2)));
          this.coinTiltX.set(Number(newTiltX.toFixed(2)));
          this.coinTiltY.set(Number(newTiltY.toFixed(2)));
        });
      }

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  private startBlinkInterval(): void {
    const scheduleNextBlink = () => {
      const delay = 2500 + Math.random() * 3000;
      this.blinkTimer = setTimeout(() => {
        if (!this.isHovered() && !this.isWinking()) {
          this.isBlinking.set(true);
          setTimeout(() => {
            this.isBlinking.set(false);
            scheduleNextBlink();
          }, 140);
        } else {
          scheduleNextBlink();
        }
      }, delay);
    };

    scheduleNextBlink();
  }

  onMouseEnter(): void {
    this.isHovered.set(true);
    this.isHappy.set(true);
  }

  onMouseLeave(): void {
    this.isHovered.set(false);
    this.isHappy.set(false);
  }

  onClickAvatar(e: Event): void {
    e.stopPropagation();
    this.isPressed.set(true);
    this.isWinking.set(true);
    this.isSpinning.set(true);

    // Reproducir micro-blip tecnológico
    this.soundService?.playBotChirp?.();

    setTimeout(() => {
      this.isPressed.set(false);
      this.isWinking.set(false);
      this.isSpinning.set(false);
    }, 350);

    this.avatarClick.emit();
  }

  getCoinTransform(): string {
    const tiltX = this.coinTiltX();
    const tiltY = this.coinTiltY();
    const spin = this.isSpinning() ? ' rotateY(360deg)' : '';
    return `perspective(500px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)${spin}`;
  }

  getLeftEyeTransform(): string {
    if (this.isBlinking()) {
      return 'scaleY(0.08)';
    }
    if (this.isNear() && !this.isHovered()) {
      return 'scale(1.1)';
    }
    return 'scale(1)';
  }

  getRightEyeTransform(): string {
    if (this.isWinking()) {
      return 'scale(1)';
    }
    if (this.isBlinking()) {
      return 'scaleY(0.08)';
    }
    if (this.isNear() && !this.isHovered()) {
      return 'scale(1.1)';
    }
    return 'scale(1)';
  }

  getEyeScale(): string {
    if (this.isBlinking()) {
      return 'scaleY(0.08)';
    }
    if (this.isNear() && !this.isHovered()) {
      return 'scale(1.15)';
    }
    return 'scale(1)';
  }
}
