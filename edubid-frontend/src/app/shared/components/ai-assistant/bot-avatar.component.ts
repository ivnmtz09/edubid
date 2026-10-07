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
        <!-- Resplandor exterior / Aura holográfica -->
        <div
          class="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 opacity-50 blur-md group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          [class.opacity-90]="isNear() || isOpen"
          [class.animate-pulse]="isOpen"
        ></div>

        <!-- DISCO CIBER-MONEDA (Transformaciones 3D aplicadas solo visualmente al disco interno) -->
        <div
          class="relative w-full h-full rounded-full transition-all duration-150"
          [style.transform]="getCoinTransform()"
          [class.scale-95]="isPressed()"
        >
          <!-- Borde biselado de la moneda: Estriado metálico dorado y circuitos -->
          <div
            class="relative w-full h-full rounded-full p-1 bg-gradient-to-br from-amber-300 via-yellow-600 to-amber-900 shadow-2xl border border-yellow-200/50 flex items-center justify-center overflow-hidden"
          >
            <!-- Ranuras/estrías perimetrales de la moneda -->
            <div
              class="absolute inset-0 rounded-full border-2 border-dashed border-amber-200/40 opacity-70 pointer-events-none"
            ></div>

            <!-- Trazas de circuito ciberespacial luminosas en el anillo exterior -->
            <svg
              class="absolute inset-0 w-full h-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity"
              viewBox="0 0 100 100"
              fill="none"
            >
              <circle cx="50" cy="50" r="45" stroke="#fef08a" stroke-width="1" stroke-dasharray="4 6" />
              <circle cx="50" cy="50" r="41" stroke="#ea580c" stroke-width="1.2" opacity="0.8" />
              <!-- Nodos de circuito -->
              <circle cx="50" cy="8" r="2" fill="#fbbf24" class="animate-ping" />
              <circle cx="92" cy="50" r="2" fill="#38bdf8" />
              <circle cx="50" cy="92" r="2" fill="#fbbf24" />
              <circle cx="8" cy="50" r="2" fill="#38bdf8" />
            </svg>

            <!-- Campo central de la Ciber-Moneda (Pantalla/Visor holográfico oscuro, 100% libre de texto) -->
            <div
              class="relative w-full h-full rounded-full bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 border-2 border-amber-500/40 flex flex-col items-center justify-center overflow-hidden shadow-inner px-2 py-1"
            >
              <!-- Destello de brillo holográfico que barre la moneda -->
              <div
                class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
              ></div>

              <!-- OJOS DIGITALES DE LA CIBER-MONEDA -->
              <div class="flex items-center justify-center gap-2.5 w-full mt-1">
                <!-- Ojo Izquierdo -->
                <div
                  class="relative w-3.5 h-4 sm:w-4 sm:h-4.5 rounded-full bg-neutral-950 border border-amber-400/40 flex items-center justify-center overflow-hidden transition-all duration-100"
                  [style.transform]="getEyeScale()"
                >
                  <!-- Expresión alegre ^ en hover -->
                  @if (isHovered() || isHappy()) {
                    <div class="w-3 h-1.5 border-t-2 border-amber-400 rounded-t-full mt-0.5 shadow-[0_0_6px_#f59e0b]"></div>
                  } @else {
                    <!-- Pupila holográfica que sigue el cursor -->
                    <div
                      class="relative w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-[0_0_8px_#f59e0b] transition-transform duration-75"
                      [style.transform]="
                        'translate(' + pupilOffsetX() + 'px, ' + pupilOffsetY() + 'px)'
                      "
                    >
                      <div class="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-white"></div>
                    </div>
                  }
                </div>

                <!-- Ojo Derecho -->
                <div
                  class="relative w-3.5 h-4 sm:w-4 sm:h-4.5 rounded-full bg-neutral-950 border border-amber-400/40 flex items-center justify-center overflow-hidden transition-all duration-100"
                  [style.transform]="isWinking() ? 'scaleY(0.1)' : getEyeScale()"
                >
                  <!-- Expresión alegre ^ en hover -->
                  @if ((isHovered() || isHappy()) && !isWinking()) {
                    <div class="w-3 h-1.5 border-t-2 border-amber-400 rounded-t-full mt-0.5 shadow-[0_0_6px_#f59e0b]"></div>
                  } @else if (!isWinking()) {
                    <!-- Pupila holográfica que sigue el cursor -->
                    <div
                      class="relative w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-[0_0_8px_#f59e0b] transition-transform duration-75"
                      [style.transform]="
                        'translate(' + pupilOffsetX() + 'px, ' + pupilOffsetY() + 'px)'
                      "
                    >
                      <div class="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-white"></div>
                    </div>
                  }
                </div>
              </div>

              <!-- Sonrisa / Arco holográfico inferior -->
              <div class="mt-1.5 flex justify-center">
                @if (isOpen) {
                  <!-- Barra luminosa activa esmeralda (sin texto) -->
                  <div class="w-3.5 h-1 bg-emerald-400 rounded-full shadow-[0_0_6px_#34d399] animate-pulse"></div>
                } @else if (isHovered() || isNear()) {
                  <!-- Sonrisa alegre -->
                  <div class="w-3 h-1 border-b-2 border-amber-300 rounded-b-full shadow-[0_0_4px_#fde047]"></div>
                } @else {
                  <!-- Línea neutral sutil -->
                  <div class="w-2 h-0.5 bg-neutral-600 rounded-full"></div>
                }
              </div>

              <!-- Mejillas con resplandor en proximidad/hover -->
              @if (isNear() || isHovered()) {
                <div class="absolute bottom-2 left-2 w-1.5 h-1 rounded-full bg-rose-400/50 blur-[1px]"></div>
                <div class="absolute bottom-2 right-2 w-1.5 h-1 rounded-full bg-rose-400/50 blur-[1px]"></div>
              }
            </div>

            <!-- LED indicador de estado en la moneda -->
            <span
              class="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-amber-900 bg-emerald-400 shadow-[0_0_6px_#34d399]"
              [class.animate-pulse]="isOpen"
              title="EDUBID IA Conectado"
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
