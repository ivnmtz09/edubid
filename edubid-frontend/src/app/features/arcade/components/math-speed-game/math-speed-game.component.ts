import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  output,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SoundService } from '../../../../core/services/sound.service';

interface MathQuestion {
  question: string;
  options: number[];
  correctAnswer: number;
  explanation: string;
}

@Component({
  selector: 'app-math-speed-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full min-h-[640px] max-w-4xl mx-auto flex flex-col items-center justify-center p-4 select-none font-sans">
      <!-- HUD Superior del Gabinete Matemático Arcade -->
      <div class="w-full max-w-2xl flex items-center justify-between mb-6 px-4 sm:px-6 py-3.5 rounded-2xl bg-neutral-950 border-2 border-neutral-800 backdrop-blur-md shadow-2xl text-xs font-mono">
        <!-- Vidas con Corazones / Baterías Vectoriales Neón -->
        <div class="flex items-center gap-2">
          <span class="text-neutral-500 font-bold tracking-wider uppercase text-[10px]">VIDAS:</span>
          <div class="flex items-center gap-1">
            @for (heart of [1, 2, 3]; track heart) {
              <svg
                class="w-4 h-4 transition-all duration-200"
                [class.text-rose-500]="heart <= lives()"
                [class.fill-current]="heart <= lives()"
                [class.drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]]="heart <= lives()"
                [class.scale-110]="heart <= lives()"
                [class.text-neutral-800]="heart > lives()"
                [class.fill-none]="heart > lives()"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            }
          </div>
        </div>

        <!-- Puntuación y Multiplicador Combo -->
        <div class="flex items-center gap-3">
          @if (combo() > 1) {
            <div class="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-black text-[10px] animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.25)]">
              <svg class="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.527.82-1.124 2.14-1.488 3.738C7.94 9.42 7.7 12.062 8.7 13.5c.348.502.824.908 1.418 1.157.447.187.935.25 1.418.175.768-.12 1.472-.544 1.968-1.182.893-1.15 1.173-2.678.995-4.25-.111-.986-.492-1.99-1.042-2.884-.537-.872-1.22-1.637-1.92-2.316a.987.987 0 00-.142-.147z" clip-rule="evenodd" />
              </svg>
              <span>COMBO x{{ combo() }}</span>
            </div>
          }
          <div class="flex items-baseline gap-1">
            <span class="text-amber-400 font-black text-xl tabular-nums drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]">{{ score() }}</span>
            <span class="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">PTS</span>
          </div>
        </div>

        <!-- Récord Máximo Histórico -->
        <div class="hidden sm:flex items-center gap-1.5 text-neutral-400">
          <svg class="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span class="text-[11px] font-bold">HI: {{ highScore() }}</span>
        </div>
      </div>

      <!-- Gabinete Central del Tablero Matemático -->
      @if (!isGameOver()) {
        <div class="w-full max-w-2xl rounded-3xl bg-neutral-950 border-2 border-neutral-800 p-6 sm:p-9 shadow-[0_0_60px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col items-center backdrop-blur-2xl">
          <!-- Decoración de Scanline interna -->
          <div class="absolute inset-0 pointer-events-none opacity-[0.03] bg-[repeating-linear-gradient(0deg,#ffffff,#ffffff_1px,transparent_1px,transparent_3px)]"></div>

          <!-- Barra de Tiempo estilo Arcade -->
          <div class="w-full h-2.5 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden mb-6 p-0.5">
            <div
              class="h-full transition-all duration-100 ease-linear rounded-full shadow-sm"
              [class.bg-emerald-400]="timeRemaining() > 5"
              [class.shadow-[0_0_8px_#34d399]]="timeRemaining() > 5"
              [class.bg-amber-400]="timeRemaining() <= 5 && timeRemaining() > 2"
              [class.shadow-[0_0_8px_#fbbf24]]="timeRemaining() <= 5 && timeRemaining() > 2"
              [class.bg-rose-500]="timeRemaining() <= 2"
              [class.shadow-[0_0_8px_#f43f5e]]="timeRemaining() <= 2"
              [style.width.%]="(timeRemaining() / maxTimePerQuestion) * 100"
            ></div>
          </div>

          <!-- Cabecera de Ronda y Reloj Digital -->
          <div class="w-full flex items-center justify-between text-xs text-neutral-400 mb-4 font-mono font-bold tracking-wider">
            <span class="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300">
              RONDA // 0{{ roundNumber() }}
            </span>
            <div
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800"
              [class.text-rose-400]="timeRemaining() <= 3"
              [class.border-rose-500/50]="timeRemaining() <= 3"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>TIME: 0{{ timeRemaining() }}S</span>
            </div>
          </div>

          <!-- Operación Matemática Principal (Pantalla CRT de Fósforo Ámbar) -->
          <div class="my-7 py-6 px-8 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 w-full text-center shadow-inner relative">
            <span class="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-extrabold mb-1.5 block">
              [ CALCULA LA EXPRESIÓN ]
            </span>
            <div class="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.2)]">
              {{ currentQuestion().question }} = <span class="text-amber-400 animate-pulse">?</span>
            </div>
          </div>

          <!-- Mensaje de Feedback Inmediato -->
          @if (feedback()) {
            <div
              class="mb-4 px-4 py-1.5 rounded-xl text-xs font-mono font-bold animate-in fade-in zoom-in-95 flex items-center gap-1.5 shadow-md"
              [class.bg-emerald-500/15]="feedback()?.isCorrect"
              [class.text-emerald-300]="feedback()?.isCorrect"
              [class.border]="true"
              [class.border-emerald-500/40]="feedback()?.isCorrect"
              [class.bg-rose-500/15]="!feedback()?.isCorrect"
              [class.text-rose-300]="!feedback()?.isCorrect"
              [class.border-rose-500/40]="!feedback()?.isCorrect"
            >
              <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                @if (feedback()?.isCorrect) {
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                } @else {
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                }
              </svg>
              <span>{{ feedback()?.message }}</span>
            </div>
          }

          <!-- Botones Arcade Sanwa de 4 Opciones -->
          <div class="grid grid-cols-2 gap-3 sm:gap-4 w-full mt-2">
            @for (opt of currentQuestion().options; track opt; let idx = $index) {
              <button
                type="button"
                (click)="selectOption(opt)"
                [disabled]="isTransitioning()"
                class="group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-neutral-900 border-2 border-neutral-800 transition-all duration-150 cursor-pointer text-left shadow-lg active:scale-95 disabled:opacity-50"
                [class.hover:border-cyan-400]="idx === 0"
                [class.hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]]="idx === 0"
                [class.hover:border-amber-400]="idx === 1"
                [class.hover:shadow-[0_0_20px_rgba(251,191,36,0.25)]]="idx === 1"
                [class.hover:border-rose-400]="idx === 2"
                [class.hover:shadow-[0_0_20px_rgba(244,63,94,0.25)]]="idx === 2"
                [class.hover:border-emerald-400]="idx === 3"
                [class.hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]]="idx === 3"
              >
                <!-- Botón de Pulsador Arcade con Número de Tecla -->
                <span
                  class="w-7 h-7 rounded-xl font-mono text-xs font-black flex items-center justify-center transition-all shadow-inner border"
                  [class.bg-cyan-500/20]="idx === 0"
                  [class.border-cyan-400/40]="idx === 0"
                  [class.text-cyan-300]="idx === 0"
                  [class.bg-amber-500/20]="idx === 1"
                  [class.border-amber-400/40]="idx === 1"
                  [class.text-amber-300]="idx === 1"
                  [class.bg-rose-500/20]="idx === 2"
                  [class.border-rose-400/40]="idx === 2"
                  [class.text-rose-300]="idx === 2"
                  [class.bg-emerald-500/20]="idx === 3"
                  [class.border-emerald-400/40]="idx === 3"
                  [class.text-emerald-300]="idx === 3"
                >
                  {{ idx + 1 }}
                </span>

                <!-- Valor Numérico -->
                <span class="text-2xl sm:text-3xl font-black font-mono text-white group-hover:text-amber-300 transition-colors">
                  {{ opt }}
                </span>
              </button>
            }
          </div>

          <!-- Guía de Teclado Estilo Arcade -->
          <div class="mt-6 text-[11px] font-mono text-neutral-500 flex items-center gap-1.5">
            <span>TECLAS RÁPIDAS:</span>
            <kbd class="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-[10px]">1</kbd>
            <kbd class="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-[10px]">2</kbd>
            <kbd class="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-[10px]">3</kbd>
            <kbd class="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-[10px]">4</kbd>
          </div>
        </div>
      }

      <!-- Modal de Game Over Estilo Cabinet Score -->
      @if (isGameOver()) {
        <div class="w-full max-w-md rounded-3xl bg-neutral-950 border-2 border-neutral-800 p-8 text-center text-white shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative overflow-hidden font-mono">
          <div class="mx-auto w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
            @if (score() > 0 && score() >= highScore()) {
              <svg class="w-8 h-8 fill-current text-amber-400" viewBox="0 0 24 24">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c1.63-.18 3.09-.99 4.09-2.22 2.47-.31 4.39-2.39 4.39-4.94V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
              </svg>
            } @else {
              <svg class="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          </div>

          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2"
              [class.bg-amber-500/20]="score() >= highScore() && score() > 0"
              [class.text-amber-300]="score() >= highScore() && score() > 0"
              [class.border]="true"
              [class.border-amber-500/40]="score() >= highScore() && score() > 0"
              [class.bg-neutral-900]="score() < highScore() || score() === 0"
              [class.text-neutral-400]="score() < highScore() || score() === 0"
            >
              {{ score() >= highScore() && score() > 0 ? 'NUEVO RÉCORD ARCADE' : 'GAME OVER // FIN' }}
            </div>
            <h3 class="text-2xl font-black tracking-tight text-white uppercase font-sans">Fin de Partida</h3>
            <p class="text-xs text-neutral-400 mt-1 font-sans">
              Completaste {{ roundNumber() - 1 }} operaciones con reflejos de cálculo mental.
            </p>
          </div>

          <!-- Métricas de Gabinete Arcade -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div class="text-[10px] uppercase font-bold tracking-wider text-neutral-400">PUNTAJE</div>
              <div class="text-2xl font-black text-amber-400 mt-0.5">{{ score() }}</div>
            </div>
            <div class="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div class="text-[10px] uppercase font-bold tracking-wider text-neutral-400">RÉCORD</div>
              <div class="text-2xl font-black text-white mt-0.5">{{ highScore() }}</div>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              (click)="restartGame()"
              class="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 transition-all shadow-lg shadow-amber-500/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4 fill-none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.038 8.038 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reintentar Partida</span>
            </button>

            <button
              type="button"
              (click)="closeGame.emit()"
              class="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer"
            >
              Volver al Catálogo
            </button>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MathSpeedGameComponent implements OnInit, OnDestroy {
  private sound = inject(SoundService);
  readonly closeGame = output<void>();

  readonly maxTimePerQuestion = 8;

  score = signal<number>(0);
  highScore = signal<number>(0);
  lives = signal<number>(3);
  combo = signal<number>(0);
  roundNumber = signal<number>(1);
  timeRemaining = signal<number>(this.maxTimePerQuestion);
  isGameOver = signal<boolean>(false);
  isTransitioning = signal<boolean>(false);
  feedback = signal<{ isCorrect: boolean; message: string } | null>(null);

  currentQuestion = signal<MathQuestion>({
    question: '7 × 8',
    options: [48, 54, 56, 62],
    correctAnswer: 56,
    explanation: '7 × 8 = 56',
  });

  private timerInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadHighScore();
    this.generateNewQuestion();
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.isGameOver() || this.isTransitioning()) return;

    if (event.key === '1' && this.currentQuestion().options[0] !== undefined) {
      this.selectOption(this.currentQuestion().options[0]);
    } else if (event.key === '2' && this.currentQuestion().options[1] !== undefined) {
      this.selectOption(this.currentQuestion().options[1]);
    } else if (event.key === '3' && this.currentQuestion().options[2] !== undefined) {
      this.selectOption(this.currentQuestion().options[2]);
    } else if (event.key === '4' && this.currentQuestion().options[3] !== undefined) {
      this.selectOption(this.currentQuestion().options[3]);
    }
  }

  selectOption(chosen: number): void {
    if (this.isTransitioning() || this.isGameOver()) return;
    this.isTransitioning.set(true);
    this.stopTimer();

    const isCorrect = chosen === this.currentQuestion().correctAnswer;

    if (isCorrect) {
      this.sound.playSuccess();
      const currentCombo = this.combo() + 1;
      this.combo.set(currentCombo);

      const timeBonus = this.timeRemaining() * 15;
      const pointsGained = (100 + timeBonus) * Math.min(4, Math.floor(currentCombo / 2) + 1);
      const newScore = this.score() + pointsGained;
      this.score.set(newScore);

      if (newScore > this.highScore()) {
        this.saveHighScore(newScore);
      }

      this.feedback.set({
        isCorrect: true,
        message: `ACIERTO: +${pointsGained} PTS`,
      });

      setTimeout(() => {
        this.feedback.set(null);
        this.roundNumber.update((r) => r + 1);
        this.generateNewQuestion();
        this.isTransitioning.set(false);
        this.startTimer();
      }, 700);
    } else {
      this.sound.playAlert();
      this.combo.set(0);
      const remainingLives = this.lives() - 1;
      this.lives.set(remainingLives);

      this.feedback.set({
        isCorrect: false,
        message: `ERROR: ERA ${this.currentQuestion().correctAnswer}`,
      });

      if (remainingLives <= 0) {
        setTimeout(() => {
          this.isGameOver.set(true);
          this.isTransitioning.set(false);
        }, 900);
      } else {
        setTimeout(() => {
          this.feedback.set(null);
          this.roundNumber.update((r) => r + 1);
          this.generateNewQuestion();
          this.isTransitioning.set(false);
          this.startTimer();
        }, 900);
      }
    }
  }

  private startTimer(): void {
    this.stopTimer();
    this.timeRemaining.set(this.maxTimePerQuestion);

    this.timerInterval = setInterval(() => {
      const remaining = this.timeRemaining() - 1;
      this.timeRemaining.set(remaining);

      if (remaining <= 0) {
        this.stopTimer();
        this.sound.playAlert();
        this.combo.set(0);
        const remLives = this.lives() - 1;
        this.lives.set(remLives);

        this.feedback.set({
          isCorrect: false,
          message: `TIEMPO AGOTADO: ERA ${this.currentQuestion().correctAnswer}`,
        });

        if (remLives <= 0) {
          setTimeout(() => {
            this.isGameOver.set(true);
          }, 900);
        } else {
          setTimeout(() => {
            this.feedback.set(null);
            this.roundNumber.update((r) => r + 1);
            this.generateNewQuestion();
            this.startTimer();
          }, 900);
        }
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  restartGame(): void {
    this.score.set(0);
    this.lives.set(3);
    this.combo.set(0);
    this.roundNumber.set(1);
    this.isGameOver.set(false);
    this.feedback.set(null);
    this.isTransitioning.set(false);
    this.generateNewQuestion();
    this.startTimer();
  }

  private generateNewQuestion(): void {
    const round = this.roundNumber();
    const ops = ['+', '-', '×'];
    if (round >= 5) ops.push('÷');

    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = 0;
    let b = 0;
    let ans = 0;
    let text = '';

    if (op === '+') {
      a = Math.floor(Math.random() * (20 + round * 3)) + 5;
      b = Math.floor(Math.random() * (20 + round * 3)) + 5;
      ans = a + b;
      text = `${a} + ${b}`;
    } else if (op === '-') {
      a = Math.floor(Math.random() * (30 + round * 4)) + 15;
      b = Math.floor(Math.random() * (a - 5)) + 4;
      ans = a - b;
      text = `${a} - ${b}`;
    } else if (op === '×') {
      a = Math.floor(Math.random() * (8 + Math.min(6, round))) + 2;
      b = Math.floor(Math.random() * (8 + Math.min(6, round))) + 2;
      ans = a * b;
      text = `${a} × ${b}`;
    } else {
      b = Math.floor(Math.random() * 8) + 2;
      ans = Math.floor(Math.random() * 12) + 2;
      a = b * ans;
      text = `${a} ÷ ${b}`;
    }

    const optionsSet = new Set<number>([ans]);
    const deltas = [-3, -2, -1, 1, 2, 3, 5, -5, 10, -10];
    let attempts = 0;

    while (optionsSet.size < 4 && attempts < 30) {
      attempts++;
      const delta = deltas[Math.floor(Math.random() * deltas.length)];
      const candidate = ans + delta;
      if (candidate >= 0 && candidate !== ans) {
        optionsSet.add(candidate);
      }
    }

    let extra = 1;
    while (optionsSet.size < 4) {
      optionsSet.add(ans + extra);
      extra++;
    }

    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    this.currentQuestion.set({
      question: text,
      options,
      correctAnswer: ans,
      explanation: `${text} = ${ans}`,
    });
  }

  private loadHighScore(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('edubid_arcade_math_highscore');
      if (saved) this.highScore.set(parseInt(saved, 10) || 0);
    } catch {
      // Ignored
    }
  }

  private saveHighScore(score: number): void {
    this.highScore.set(score);
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('edubid_arcade_math_highscore', score.toString());
    } catch {
      // Ignored
    }
  }
}
