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
  template: `
    <!-- Barra HUD Flotante (Esquina inferior derecha en modo fondo, o superior en arcade) -->
    <div
      class="fixed z-30 transition-all duration-300 pointer-events-auto"
      [class.bottom-4]="!isArcadeFocus()"
      [class.right-4]="!isArcadeFocus()"
      [class.top-4]="isArcadeFocus()"
      [class.left-1/2]="isArcadeFocus()"
      [class.-translate-x-1/2]="isArcadeFocus()"
    >
      <div
        class="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-white/20 dark:border-white/10 bg-slate-900/90 backdrop-blur-md shadow-2xl text-white select-none text-xs font-medium"
      >
        <!-- Icono y Título del Juego (Puro SVG, sin emojis) -->
        <div class="flex items-center gap-2 pr-2 border-r border-white/15">
          @if (gameType() === 'coins') {
            <!-- Icono Moneda SVG -->
            <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          } @else {
            <!-- Icono Nave Espacial SVG -->
            <svg class="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.84 2.58m-.12-4.8L5.05 16.73A2 2 0 012.22 13.9l4.58-4.58a14.94 14.94 0 012.83-1.07" />
            </svg>
          }
          <span class="font-bold tracking-tight hidden sm:inline">{{ gameTitle() }}</span>
        </div>

        <!-- Puntuación actual -->
        <div class="flex items-center gap-1.5">
          <span class="text-amber-400 font-bold text-sm tracking-wider">{{ score() }}</span>
          <span class="text-[10px] uppercase tracking-wider text-slate-400">pts</span>
        </div>

        <!-- Récord (High Score) con Icono SVG de Estrella -->
        <div class="hidden md:flex items-center gap-1 text-slate-300 pl-2 border-l border-white/15">
          <svg class="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span class="text-[11px] font-semibold text-slate-300">{{ highScore() }}</span>
        </div>

        <!-- Vidas restantes (Corazones SVG vectoriales, sin emojis) -->
        <div class="flex items-center gap-1 pl-2 border-l border-white/15">
          @for (heart of [1, 2, 3]; track heart) {
            <svg
              class="w-3.5 h-3.5 transition-all duration-200"
              [class.text-rose-500]="heart <= lives()"
              [class.fill-current]="heart <= lives()"
              [class.text-slate-600]="heart > lives()"
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
        <div class="flex items-center gap-1 pl-2 border-l border-white/15">
          <!-- Botón Reiniciar con Icono SVG -->
          <button
            type="button"
            (click)="restart.emit()"
            class="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
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
              class="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/30 transition-all cursor-pointer font-semibold text-[11px]"
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
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-white/20 transition-all cursor-pointer font-semibold text-[11px]"
              title="Volver a ver la página EduBid (tecla Esc)"
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

    <!-- Modal de Fin de Partida (Game Over) (Puro SVG, sin emojis) -->
    @if (isGameOver()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto"
      >
        <div
          class="w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900/95 p-6 text-center text-white shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        >
          <!-- Icono SVG del resultado de partida -->
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
            @if (score() >= highScore() && score() > 0) {
              <!-- Trofeo SVG -->
              <svg class="w-7 h-7 fill-current" viewBox="0 0 24 24">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c1.63-.18 3.09-.99 4.09-2.22 2.47-.31 4.39-2.39 4.39-4.94V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
              </svg>
            } @else {
              <!-- Alerta / Fin SVG -->
              <svg class="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            }
          </div>

          <div class="space-y-1">
            <h3 class="text-xl font-black tracking-tight text-white">
              ¡Partida Terminada!
            </h3>
            <p class="text-xs text-slate-400">
              {{ score() >= highScore() && score() > 0 ? '¡Nuevo récord histórico alcanzado!' : 'Sigue practicando para superar tu récord.' }}
            </p>
          </div>

          <!-- Puntuaciones -->
          <div class="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <div class="text-[10px] uppercase font-bold text-slate-400">Puntaje</div>
              <div class="text-2xl font-black text-amber-400">{{ score() }}</div>
            </div>
            <div>
              <div class="text-[10px] uppercase font-bold text-slate-400">Mejor Récord</div>
              <div class="text-2xl font-black text-white">{{ highScore() }}</div>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="flex flex-col gap-2 pt-2">
            <button
              type="button"
              (click)="restart.emit()"
              class="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-linear-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Jugar de nuevo
            </button>

            @if (isArcadeFocus()) {
              <button
                type="button"
                (click)="toggleArcade.emit()"
                class="w-full py-2 px-4 rounded-xl font-medium text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Volver a navegar la web
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

  readonly restart = output<void>();
  readonly toggleArcade = output<void>();
}
