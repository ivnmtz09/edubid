import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-hud',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block',
  },
  template: `
    <!-- Barra HUD Flotante (Esquina inferior derecha en modo fondo, o superior centrada en arcade) -->
    <div
      class="fixed z-30 transition-all duration-300 pointer-events-auto"
      [class.bottom-5]="!isArcadeFocus()"
      [class.right-5]="!isArcadeFocus()"
      [class.top-20]="isArcadeFocus()"
      [class.left-1/2]="isArcadeFocus()"
      [class.-translate-x-1/2]="isArcadeFocus()"
    >
      <div
        class="flex items-center gap-2.5 sm:gap-3.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-white/20 dark:border-white/10 bg-neutral-950/90 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.65)] text-white select-none text-xs font-medium ring-1 ring-amber-500/20"
      >
        <!-- Icono y Título del Juego (Puro SVG con icono EduCoins o Caza) -->
        <div class="flex items-center gap-2 pr-2.5 border-r border-white/15">
          @if (gameType() === 'coins') {
            <!-- Icono EduCoin 'E' Relieve Dorado -->
            <div class="w-5 h-5 rounded-full bg-linear-to-b from-amber-300 via-amber-500 to-amber-600 flex items-center justify-center shadow-xs ring-1 ring-amber-300/40 shrink-0">
              <span class="text-[10px] font-black text-amber-950 leading-none">E</span>
            </div>
          } @else {
            <!-- Icono Caza Estelar Interceptor SVG -->
            <div class="w-5 h-5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.84 2.58m-.12-4.8L5.05 16.73A2 2 0 012.22 13.9l4.58-4.58a14.94 14.94 0 012.83-1.07" />
              </svg>
            </div>
          }
          <span class="font-bold tracking-tight hidden sm:inline text-neutral-100">{{ gameTitle() }}</span>
        </div>

        <!-- Puntuación actual con efecto resplandor numérico -->
        <div class="flex items-center gap-1.5 px-1">
          <span class="text-amber-400 font-black text-sm tracking-wider font-mono drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]">{{ score() }}</span>
          <span class="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">pts</span>
        </div>

        <!-- Racha / Multiplicador de Combo -->
        @if (combo() >= 2) {
          <div class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-linear-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 font-black text-[10px] animate-pulse">
            <svg class="w-3 h-3 text-amber-400 fill-current shrink-0" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.527.82-1.124 2.14-1.488 3.738C7.94 9.42 7.7 12.062 8.7 13.5c.348.502.824.908 1.418 1.157.447.187.935.25 1.418.175.768-.12 1.472-.544 1.968-1.182.893-1.15 1.173-2.678.995-4.25-.111-.986-.492-1.99-1.042-2.884-.537-.872-1.22-1.637-1.92-2.316a.987.987 0 00-.142-.147z" clip-rule="evenodd" />
            </svg>
            <span>x{{ combo() >= 12 ? 4 : combo() >= 8 ? 3 : 2 }}</span>
          </div>
        }

        <!-- Récord (High Score) con Icono SVG de Corona / Estrella -->
        <div class="hidden md:flex items-center gap-1.5 text-neutral-300 pl-2.5 border-l border-white/15">
          <svg class="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span class="text-[11px] font-semibold text-neutral-300 font-mono">{{ highScore() }}</span>
        </div>

        <!-- Vidas restantes (Corazones vectoriales con brillo) -->
        <div class="flex items-center gap-1 pl-2.5 border-l border-white/15">
          @for (heart of [1, 2, 3]; track heart) {
            <svg
              class="w-3.5 h-3.5 transition-all duration-200"
              [class.text-rose-500]="heart <= lives()"
              [class.fill-current]="heart <= lives()"
              [class.drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]]="heart <= lives()"
              [class.text-neutral-700]="heart > lives()"
              [class.fill-none]="heart > lives()"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          }
        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center gap-1.5 pl-2.5 border-l border-white/15">
          <!-- Botón Pausa / Reanudar -->
          <button
            type="button"
            (click)="togglePause.emit()"
            class="p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            [class.text-amber-400]="isPaused()"
            [class.text-neutral-300]="!isPaused()"
            [class.hover:text-white]="!isPaused()"
            [title]="isPaused() ? 'Reanudar partida (Tecla P)' : 'Pausar partida (Tecla P)'"
          >
            @if (isPaused()) {
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            } @else {
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            }
          </button>

          <!-- Botón Reiniciar con Icono SVG -->
          <button
            type="button"
            (click)="restart.emit()"
            class="p-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Reiniciar partida"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <!-- Toggle Modo Arcade Enfocado con Icono SVG -->
          @if (!isArcadeFocus()) {
            <button
              type="button"
              (click)="toggleArcade.emit()"
              class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-linear-to-r from-amber-500/25 to-yellow-500/25 hover:from-amber-500/35 hover:to-yellow-500/35 text-amber-300 hover:text-amber-200 border border-amber-500/40 shadow-xs transition-all cursor-pointer font-bold text-[11px]"
              title="Jugar en pantalla completa interactiva"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <span class="hidden sm:inline">Enfocar</span>
            </button>
          } @else {
            <button
              type="button"
              (click)="toggleArcade.emit()"
              class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/20 transition-all cursor-pointer font-semibold text-[11px]"
              title="Volver al catálogo arcade (tecla Esc)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Salir (Esc)</span>
            </button>
          }
        </div>
      </div>
    </div>

    <!-- Barra Inferior de Control en Modo Arcade Enfocado -->
    @if (isArcadeFocus()) {
      <div
        class="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2.5 sm:gap-3 px-4 py-2 rounded-full border border-white/15 bg-neutral-950/90 backdrop-blur-xl shadow-2xl text-[11px] font-medium text-neutral-300 select-none animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-[94vw] overflow-x-auto"
      >
        <div class="flex items-center gap-1.5 shrink-0">
          <kbd class="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white font-mono text-[10px] shadow-xs">← / →</kbd>
          <span class="text-neutral-400">o Mouse:</span>
          <span class="text-neutral-200 font-semibold">Mover</span>
        </div>
        <span class="text-white/20 shrink-0">•</span>
        <div class="flex items-center gap-1.5 shrink-0">
          <kbd class="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white font-mono text-[10px] shadow-xs">Espacio</kbd>
          <span class="text-neutral-200 font-semibold">Acción</span>
        </div>
        <span class="text-white/20 shrink-0">•</span>
        <div class="flex items-center gap-1.5 shrink-0">
          <kbd class="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white font-mono text-[10px] shadow-xs">P</kbd>
          <span class="text-neutral-200 font-semibold">Pausar</span>
        </div>
        <span class="text-white/20 shrink-0">•</span>
        <div class="flex items-center gap-1.5 shrink-0">
          <kbd class="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white font-mono text-[10px] shadow-xs">Esc</kbd>
          <span class="text-neutral-200 font-semibold">Salir</span>
        </div>
      </div>
    }

    <!-- Overlay de Juego en Pausa -->
    @if (isPaused() && !isGameOver()) {
      <div
        class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto"
      >
        <div
          class="px-8 py-7 rounded-3xl border border-white/20 bg-neutral-950/95 shadow-2xl text-center flex flex-col items-center gap-4.5 max-w-xs animate-in zoom-in-95 duration-200 text-white"
        >
          <div class="w-13 h-13 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/15">
            <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </div>
          <div>
            <h4 class="text-lg font-black tracking-wide uppercase text-white">Partida en Pausa</h4>
            <p class="text-xs text-neutral-400 mt-1">Presiona la tecla <kbd class="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white font-mono text-[10px]">P</kbd> o el botón inferior para continuar</p>
          </div>
          <button
            type="button"
            (click)="togglePause.emit()"
            class="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-linear-to-r from-amber-500 to-yellow-400 text-neutral-950 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Reanudar Partida</span>
          </button>
        </div>
      </div>
    }

    <!-- Modal de Fin de Partida (Game Over) Pulido (Puro SVG, sin emojis) -->
    @if (isGameOver()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto"
      >
        <div
          class="w-full max-w-sm rounded-3xl border border-white/15 bg-neutral-950/95 p-6 text-center text-white shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden"
        >
          <!-- Acentos de fondo sutil con gradiente SVG -->
          <div class="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-amber-500/15 blur-2xl pointer-events-none"></div>
          <div class="absolute -bottom-16 -right-16 w-32 h-32 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none"></div>

          <!-- Icono Trofeo / Fin con efecto pulido -->
          <div class="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border transition-transform duration-300 hover:scale-105"
            [class.bg-amber-500/20]="score() >= highScore() && score() > 0"
            [class.border-amber-500/40]="score() >= highScore() && score() > 0"
            [class.text-amber-400]="score() >= highScore() && score() > 0"
            [class.shadow-amber-500/25]="score() >= highScore() && score() > 0"
            [class.shadow-lg]="score() >= highScore() && score() > 0"
            [class.bg-rose-500/20]="score() < highScore() || score() === 0"
            [class.border-rose-500/40]="score() < highScore() || score() === 0"
            [class.text-rose-400]="score() < highScore() || score() === 0"
          >
            @if (score() >= highScore() && score() > 0) {
              <!-- Trofeo de Victoria Vectorial Detallado -->
              <svg class="w-8 h-8 fill-current drop-shadow-sm" viewBox="0 0 24 24">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c1.63-.18 3.09-.99 4.09-2.22 2.47-.31 4.39-2.39 4.39-4.94V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
              </svg>
            } @else {
              <!-- Alerta Escudo Vectorial -->
              <svg class="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            }
          </div>

          <div class="space-y-1 relative z-10">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1"
              [class.bg-amber-500/20]="score() >= highScore() && score() > 0"
              [class.text-amber-300]="score() >= highScore() && score() > 0"
              [class.border]="score() >= highScore() && score() > 0"
              [class.border-amber-500/30]="score() >= highScore() && score() > 0"
              [class.bg-neutral-800]="score() < highScore() || score() === 0"
              [class.text-neutral-400]="score() < highScore() || score() === 0"
            >
              {{ score() >= highScore() && score() > 0 ? '¡Récord Absoluto!' : 'Fin de Partida' }}
            </div>
            <h3 class="text-xl font-black tracking-tight text-white">
              {{ score() >= highScore() && score() > 0 ? '¡Nuevo Récord Conseguido!' : '¡Buen Intento!' }}
            </h3>
            <p class="text-xs text-neutral-400">
              {{ score() >= highScore() && score() > 0 ? 'Has superado la marca máxima de la sesión en EduBid.' : 'Vuelve a intentarlo para superar tu mejor récord personal.' }}
            </p>
          </div>

          <!-- Tarjeta de Puntuaciones Pulida con Bento Glassmorphism -->
          <div class="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 relative z-10">
            <div class="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5">
              <div class="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Puntaje Final</div>
              <div class="text-2xl font-black text-amber-400 font-mono mt-0.5 drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]">{{ score() }}</div>
            </div>
            <div class="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5">
              <div class="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Mejor Récord</div>
              <div class="text-2xl font-black text-white font-mono mt-0.5">{{ highScore() }}</div>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="flex flex-col gap-2 pt-2 relative z-10">
            <button
              type="button"
              (click)="restart.emit()"
              class="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-linear-to-r from-amber-500 to-yellow-400 text-neutral-950 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Jugar de nuevo</span>
            </button>

            @if (isArcadeFocus()) {
              <button
                type="button"
                (click)="toggleArcade.emit()"
                class="w-full py-2 px-4 rounded-xl font-medium text-xs text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Volver al catálogo
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameHudComponent {
  readonly gameTitle = input.required<string>();
  readonly gameType = input<'coins' | 'galaga'>('coins');
  readonly score = input.required<number>();
  readonly highScore = input.required<number>();
  readonly lives = input.required<number>();
  readonly isGameOver = input.required<boolean>();
  readonly isArcadeFocus = input<boolean>(false);
  readonly isPaused = input<boolean>(false);
  readonly combo = input<number>(0);

  readonly restart = output<void>();
  readonly toggleArcade = output<void>();
  readonly togglePause = output<void>();
}
