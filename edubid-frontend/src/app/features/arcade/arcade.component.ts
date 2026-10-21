import {
  Component,
  OnInit,
  signal,
  inject,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SoundService } from '../../core/services/sound.service';
import { GuardianQuizComponent } from './components/guardian-quiz/guardian-quiz.component';
import { MathSpeedGameComponent } from './components/math-speed-game/math-speed-game.component';
import { CoinCollectorGameComponent } from '../home/components/home-games/coin-collector-game.component';
import { GalagaGameComponent } from '../home/components/home-games/galaga-game.component';

export type ArcadeGameType = 'coins' | 'galaga' | 'math';

@Component({
  selector: 'app-arcade',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    GuardianQuizComponent,
    MathSpeedGameComponent,
    CoinCollectorGameComponent,
    GalagaGameComponent,
  ],
  template: `
    <div class="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-between selection:bg-amber-500 selection:text-neutral-950 font-sans relative overflow-x-hidden">
      <!-- Capa Scanline CRT Retro Arcade Global (Sutil) -->
      <div
        class="pointer-events-none fixed inset-0 z-50 opacity-[0.035] bg-[repeating-linear-gradient(0deg,#000000,#000000_1px,transparent_1px,transparent_2px)]"
        aria-hidden="true"
      ></div>

      <!-- Resplandores Atmosféricos de Iluminación Neón Arcade -->
      <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div class="absolute -top-32 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[130px]"></div>
        <div class="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[150px]"></div>
        <div class="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>
      </div>

      <!-- Marquee Superior de la Cabina Arcade -->
      <header class="relative z-40 h-16 border-b-2 border-neutral-800 bg-neutral-950/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
        <!-- Izquierda: Botón de Retorno con Icono Vectorial -->
        <div class="flex items-center gap-3">
          @if (selectedGame()) {
            <button
              type="button"
              (click)="backToCatalog()"
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-400/50 hover:bg-neutral-850 text-xs font-mono font-bold text-neutral-300 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>[ CATÁLOGO ]</span>
            </button>
          } @else {
            <a
              routerLink="/"
              class="inline-flex items-center gap-2 font-mono text-xs font-bold text-neutral-400 hover:text-white transition-colors group"
            >
              <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1 text-neutral-500 group-hover:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>SALIR // EDUBID</span>
            </a>
          }
        </div>

        <!-- Centro: Marquee Principal Neón Arcade (Puro SVG, cero emojis) -->
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 shadow-[0_0_15px_rgba(251,191,36,0.4)] shrink-0">
            <!-- Icono Vectorial Arcade: Joystick + Pulsadores -->
            <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <div class="flex flex-col text-left">
            <span class="font-mono text-xs font-black tracking-widest uppercase text-white flex items-center gap-2">
              EDUBID ARCADE SYSTEM
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </span>
            <span class="font-mono text-[9px] tracking-wider text-amber-400/80 font-bold">
              NEO-GEO CPS-26 • 60 FPS • FREE PLAY
            </span>
          </div>
        </div>

        <!-- Derecha: Estado de Créditos, Audio y Bloqueo -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Indicador LED Digital de Créditos -->
          <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-[10px] text-neutral-300">
            <span class="text-neutral-500 font-bold">CREDITS:</span>
            <span class="text-emerald-400 font-black">99</span>
          </div>

          <!-- Toggle Sonido con Icono Altavoz SVG -->
          <button
            type="button"
            (click)="sound.toggleMute()"
            class="p-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            [title]="sound.isMuted() ? 'Activar audio arcade' : 'Silenciar audio arcade'"
          >
            @if (sound.isMuted()) {
              <svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            } @else {
              <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            }
          </button>

          <!-- Botón Bloquear Terminal Arcade -->
          @if (isUnlocked() && !selectedGame()) {
            <button
              type="button"
              (click)="lockArcade()"
              class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 font-mono text-[11px] font-bold text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              title="Volver a bloquear con acertijo"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>BLOQUEAR</span>
            </button>
          }
        </div>
      </header>

      <!-- Área de Contenido Principal -->
      <main class="relative z-10 flex-1 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
        <!-- Estado 1: Bloqueado por el Acertijo del Guardián -->
        @if (!isUnlocked()) {
          <app-guardian-quiz (unlocked)="onGuardianUnlocked()" />
        }

        <!-- Estado 2: Catálogo de Gabinetes Arcade Desbloqueado -->
        @else if (isUnlocked() && !selectedGame()) {
          <div class="max-w-6xl mx-auto w-full space-y-10 animate-in fade-in duration-300">
            <!-- Ticker Superior Arcade Marquee -->
            <div class="text-center space-y-3 max-w-2xl mx-auto">
              <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-950 border border-neutral-800 font-mono text-[11px] font-bold tracking-wider text-amber-400 shadow-inner">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>INSERT COIN // 1P READY // SELECCIONA TU GABINETE</span>
              </div>
              <h1 class="text-2xl sm:text-4xl lg:text-[2.6rem] font-black font-mono tracking-wider text-white uppercase leading-snug sm:leading-snug drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] my-2">
                Zona Arcade Pedagógica
              </h1>
              <p class="font-mono text-xs text-neutral-400 max-w-lg mx-auto leading-relaxed">
                SIMULADORES EDUCATIVOS DE ALTO RENDIMIENTO • REFLEJOS & COGNICIÓN
              </p>
            </div>

            <!-- Fila de Gabinetes Arcade (3 Máquinas Arcade) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              
              <!-- GABINETE 1: Recolector de EduCoins -->
              <div class="group relative rounded-3xl bg-neutral-950 border-2 border-neutral-800 p-6 flex flex-col justify-between hover:border-amber-400 hover:shadow-[0_0_35px_rgba(251,191,36,0.2)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <!-- Bezel interno de luz neón -->
                <div class="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all"></div>

                <div>
                  <!-- Marquee Superior de la Máquina -->
                  <div class="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800/80">
                    <span class="font-mono text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      PCB-01 // COIN-OP
                    </span>
                    <span class="font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm bg-neutral-900 border border-neutral-800 text-neutral-400">
                      1-PLAYER
                    </span>
                  </div>

                  <!-- Pantalla CRT Simulada con Arte Vectorial -->
                  <div class="w-full h-36 rounded-2xl bg-neutral-900 border border-neutral-800/90 mb-5 relative flex items-center justify-center overflow-hidden shadow-inner group-hover:border-amber-500/40 transition-colors">
                    <!-- Cuadrícula de fondo CRT -->
                    <div class="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:12px_12px] opacity-40"></div>
                    
                    <!-- Arte Vectorial: Moneda Dorada Relieve y Estudiante -->
                    <div class="relative z-10 flex flex-col items-center">
                      <div class="w-16 h-16 rounded-full bg-linear-to-b from-amber-300 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40 ring-2 ring-amber-300/50 group-hover:scale-110 transition-transform duration-300">
                        <span class="text-3xl font-black text-amber-950 leading-none">E</span>
                      </div>
                      <span class="font-mono text-[10px] font-bold text-amber-300 tracking-widest uppercase mt-2">
                        EDUCOINS
                      </span>
                    </div>

                    <!-- Esquinas de Bezel -->
                    <div class="absolute top-2 left-2 text-[8px] font-mono text-neutral-600">┌</div>
                    <div class="absolute top-2 right-2 text-[8px] font-mono text-neutral-600">┐</div>
                    <div class="absolute bottom-2 left-2 text-[8px] font-mono text-neutral-600">└</div>
                    <div class="absolute bottom-2 right-2 text-[8px] font-mono text-neutral-600">┘</div>
                  </div>

                  <h3 class="text-xl font-black font-mono tracking-tight text-white group-hover:text-amber-300 transition-colors mb-2 uppercase">
                    Recolector de EduCoins
                  </h3>
                  <p class="text-xs text-neutral-400 leading-relaxed mb-6 font-sans">
                    Guía al estudiante sobre la explanada académica. Atrapa gemas de estudio y monedas doradas mientras esquivas los distractores diarios.
                  </p>
                </div>

                <!-- Deck de Control y Botón Press Start -->
                <div class="space-y-4 pt-4 border-t border-neutral-800/80 font-mono">
                  <!-- Control Deck Vectorial Preview -->
                  <div class="flex items-center justify-between text-[10px] text-neutral-500 pb-1">
                    <span class="flex items-center gap-1">
                      <svg class="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      JOYSTICK A/D
                    </span>
                    <span class="text-amber-400 font-bold">HI: {{ coinHighScore() }} PTS</span>
                  </div>

                  <!-- Botón Estilo Pulsador Arcade -->
                  <button
                    type="button"
                    (click)="playGame('coins')"
                    class="w-full py-3 px-4 rounded-xl font-mono font-black text-xs uppercase tracking-widest bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 hover:brightness-110"
                  >
                    <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>▶ 1P START</span>
                  </button>
                </div>
              </div>

              <!-- GABINETE 2: Defensor Espacial EduBid (Galaga) -->
              <div class="group relative rounded-3xl bg-neutral-950 border-2 border-neutral-800 p-6 flex flex-col justify-between hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.2)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <!-- Bezel interno de luz neón -->
                <div class="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition-all"></div>

                <div>
                  <!-- Marquee Superior de la Máquina -->
                  <div class="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800/80">
                    <span class="font-mono text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      PCB-02 // SHOOTER
                    </span>
                    <span class="font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm bg-neutral-900 border border-neutral-800 text-neutral-400">
                      80S CLASSIC
                    </span>
                  </div>

                  <!-- Pantalla CRT Simulada con Arte Vectorial -->
                  <div class="w-full h-36 rounded-2xl bg-neutral-900 border border-neutral-800/90 mb-5 relative flex items-center justify-center overflow-hidden shadow-inner group-hover:border-cyan-500/40 transition-colors">
                    <div class="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:12px_12px] opacity-40"></div>
                    
                    <!-- Arte Vectorial: Caza Estelar con Disparos Láser Gemelos -->
                    <div class="relative z-10 flex flex-col items-center">
                      <div class="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
                        <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.84 2.58m-.12-4.8L5.05 16.73A2 2 0 012.22 13.9l4.58-4.58a14.94 14.94 0 012.83-1.07" />
                        </svg>
                      </div>
                      <span class="font-mono text-[10px] font-bold text-cyan-300 tracking-widest uppercase mt-2">
                        STAR DEFENDER
                      </span>
                    </div>

                    <div class="absolute top-2 left-2 text-[8px] font-mono text-neutral-600">┌</div>
                    <div class="absolute top-2 right-2 text-[8px] font-mono text-neutral-600">┐</div>
                    <div class="absolute bottom-2 left-2 text-[8px] font-mono text-neutral-600">└</div>
                    <div class="absolute bottom-2 right-2 text-[8px] font-mono text-neutral-600">┘</div>
                  </div>

                  <h3 class="text-xl font-black font-mono tracking-tight text-white group-hover:text-cyan-300 transition-colors mb-2 uppercase">
                    Defensor Espacial EduBid
                  </h3>
                  <p class="text-xs text-neutral-400 leading-relaxed mb-6 font-sans">
                    Pilota la nave del pensamiento crítico a través del cinturón de asteroides de la desinformación. Destruye falacias con tus proyectiles de lógica pura.
                  </p>
                </div>

                <!-- Deck de Control y Botón Press Start -->
                <div class="space-y-4 pt-4 border-t border-neutral-800/80 font-mono">
                  <div class="flex items-center justify-between text-[10px] text-neutral-500 pb-1">
                    <span class="flex items-center gap-1">
                      <svg class="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      ESPACIO: DISPARO
                    </span>
                    <span class="text-cyan-400 font-bold">HI: {{ galagaHighScore() }} PTS</span>
                  </div>

                  <button
                    type="button"
                    (click)="playGame('galaga')"
                    class="w-full py-3 px-4 rounded-xl font-mono font-black text-xs uppercase tracking-widest bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 hover:brightness-110"
                  >
                    <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>▶ 1P START</span>
                  </button>
                </div>
              </div>

              <!-- GABINETE 3: Relámpago Matemático -->
              <div class="group relative rounded-3xl bg-neutral-950 border-2 border-neutral-800 p-6 flex flex-col justify-between hover:border-emerald-400 hover:shadow-[0_0_35px_rgba(16,185,129,0.2)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <!-- Bezel interno de luz neón -->
                <div class="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>

                <div>
                  <!-- Marquee Superior de la Máquina -->
                  <div class="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800/80">
                    <span class="font-mono text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      PCB-03 // BRAIN SPRINT
                    </span>
                    <span class="font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm bg-neutral-900 border border-neutral-800 text-neutral-400">
                      TIME ATTACK
                    </span>
                  </div>

                  <!-- Pantalla CRT Simulada con Arte Vectorial -->
                  <div class="w-full h-36 rounded-2xl bg-neutral-900 border border-neutral-800/90 mb-5 relative flex items-center justify-center overflow-hidden shadow-inner group-hover:border-emerald-500/40 transition-colors">
                    <div class="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:12px_12px] opacity-40"></div>
                    
                    <!-- Arte Vectorial: Matriz de Operaciones Matemáticas Neón -->
                    <div class="relative z-10 flex flex-col items-center">
                      <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                        <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span class="font-mono text-[10px] font-bold text-emerald-300 tracking-widest uppercase mt-2">
                        SPEED MATH
                      </span>
                    </div>

                    <div class="absolute top-2 left-2 text-[8px] font-mono text-neutral-600">┌</div>
                    <div class="absolute top-2 right-2 text-[8px] font-mono text-neutral-600">┐</div>
                    <div class="absolute bottom-2 left-2 text-[8px] font-mono text-neutral-600">└</div>
                    <div class="absolute bottom-2 right-2 text-[8px] font-mono text-neutral-600">┘</div>
                  </div>

                  <h3 class="text-xl font-black font-mono tracking-tight text-white group-hover:text-emerald-300 transition-colors mb-2 uppercase">
                    Relámpago Matemático
                  </h3>
                  <p class="text-xs text-neutral-400 leading-relaxed mb-6 font-sans">
                    Ráfaga de operaciones matemáticas contra reloj. Resuelve sumas, restas, multiplicaciones y divisiones antes de que expire el tiempo y encadena combos.
                  </p>
                </div>

                <!-- Deck de Control y Botón Press Start -->
                <div class="space-y-4 pt-4 border-t border-neutral-800/80 font-mono">
                  <div class="flex items-center justify-between text-[10px] text-neutral-500 pb-1">
                    <span class="flex items-center gap-1">
                      <svg class="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      TECLAS 1, 2, 3, 4
                    </span>
                    <span class="text-emerald-400 font-bold">HI: {{ mathHighScore() }} PTS</span>
                  </div>

                  <button
                    type="button"
                    (click)="playGame('math')"
                    class="w-full py-3 px-4 rounded-xl font-mono font-black text-xs uppercase tracking-widest bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 hover:brightness-110"
                  >
                    <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>▶ 1P START</span>
                  </button>
                </div>
              </div>

            </div>

            <!-- Panel Inferior de Cita Pedagógica Estilo Arcade -->
            <div class="max-w-xl mx-auto p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center font-mono text-xs text-neutral-400 shadow-inner">
              <span class="text-neutral-300">"El juego es la forma más elevada de la investigación."</span>
              <span class="block text-[10px] text-amber-400/80 mt-1 font-bold">— ALBERT EINSTEIN</span>
            </div>
          </div>
        }

        <!-- Estado 3: Minijuego en Ejecución (Gabinete Arcade de Pantalla Completa) -->
        @else if (selectedGame() === 'coins') {
          <div class="fixed inset-0 z-30 pt-16 overflow-hidden">
            <app-coin-collector-game
              [isArcadeFocus]="true"
              (toggleArcadeFocus)="backToCatalog()"
              (closeArcade)="backToCatalog()"
            />
          </div>
        } @else if (selectedGame() === 'galaga') {
          <div class="fixed inset-0 z-30 pt-16 overflow-hidden">
            <app-galaga-game
              [isArcadeFocus]="true"
              (toggleArcadeFocus)="backToCatalog()"
              (closeArcade)="backToCatalog()"
            />
          </div>
        } @else if (selectedGame() === 'math') {
          <app-math-speed-game (closeGame)="backToCatalog()" />
        }
      </main>

      <!-- Footer Estilo Kiosco Arcade -->
      <footer class="relative z-40 border-t-2 border-neutral-800 bg-neutral-950/90 py-3.5 px-6 text-center font-mono text-xs text-neutral-500">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span class="flex items-center gap-1.5 justify-center">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            EDUBID ARCADE HARDWARE // ARCHITECTURE 2026 // PEDAGOGÍA GAMIFICADA
          </span>
          <div class="flex items-center gap-3 justify-center">
            <a routerLink="/" class="hover:text-amber-400 transition-colors">[ RETORNAR A EDUBID ]</a>
            <span class="text-neutral-700">•</span>
            <span class="text-neutral-400">ALL RIGHTS RESERVED</span>
          </div>
        </div>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArcadeComponent implements OnInit {
  readonly sound = inject(SoundService);
  private router = inject(Router);

  isUnlocked = signal<boolean>(this.checkIfUnlocked());
  selectedGame = signal<ArcadeGameType | null>(null);

  coinHighScore = signal<number>(0);
  galagaHighScore = signal<number>(0);
  mathHighScore = signal<number>(0);

  ngOnInit(): void {
    this.refreshHighScores();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.selectedGame()) {
      this.backToCatalog();
    }
  }

  private checkIfUnlocked(): boolean {
    if (typeof sessionStorage === 'undefined') return false;
    try {
      return sessionStorage.getItem('edubid_arcade_unlocked') === 'true';
    } catch {
      return false;
    }
  }

  onGuardianUnlocked(): void {
    this.isUnlocked.set(true);
    this.refreshHighScores();
  }

  lockArcade(): void {
    this.isUnlocked.set(false);
    this.selectedGame.set(null);
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem('edubid_arcade_unlocked');
      } catch {
        // Ignored
      }
    }
  }

  playGame(game: ArcadeGameType): void {
    this.selectedGame.set(game);
  }

  backToCatalog(): void {
    this.selectedGame.set(null);
    this.refreshHighScores();
  }

  refreshHighScores(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const c = localStorage.getItem('edubid_coins_highscore');
      if (c) this.coinHighScore.set(parseInt(c, 10) || 0);

      const g = localStorage.getItem('edubid_galaga_highscore');
      if (g) this.galagaHighScore.set(parseInt(g, 10) || 0);

      const m = localStorage.getItem('edubid_arcade_math_highscore');
      if (m) this.mathHighScore.set(parseInt(m, 10) || 0);
    } catch {
      // Ignored
    }
  }
}
