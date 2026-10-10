import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
  NgZone,
  inject,
  signal,
  input,
  output,
  HostListener,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameHudComponent } from './game-hud.component';
import { SoundService } from '../../../../core/services/sound.service';

interface Laser {
  id: number;
  x: number;
  y: number;
  vy: number;
}

interface Enemy {
  id: number;
  type: 'asteroid' | 'galaga';
  x: number;
  y: number;
  initialX: number;
  vy: number;
  hp: number;
  maxHp: number;
  rotation: number;
  vRot: number;
  size: number;
  phase: number;
  points: number;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
}

@Component({
  selector: 'app-galaga-game',
  standalone: true,
  imports: [CommonModule, GameHudComponent],
  template: `
    <!-- Contenedor Principal del Juego Galaga SVG -->
    <div
      class="fixed inset-0 z-0 w-full h-full select-none overflow-hidden"
      [class.pointer-events-none]="!isArcadeFocus()"
      [class.pointer-events-auto]="isArcadeFocus()"
    >
      <svg
        #svgEl
        class="w-full h-full block"
        [attr.viewBox]="'0 0 ' + viewWidth() + ' ' + viewHeight()"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <!-- Gradientes Vectoriales Ligeros (Sin filtros pesados) -->
          <linearGradient id="shipBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="40%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#0369a1" />
          </linearGradient>

          <linearGradient id="alienGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f43f5e" />
            <stop offset="60%" stop-color="#be123c" />
            <stop offset="100%" stop-color="#881337" />
          </linearGradient>

          <linearGradient id="asteroidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#64748b" />
            <stop offset="50%" stop-color="#475569" />
            <stop offset="100%" stop-color="#334155" />
          </linearGradient>
        </defs>

        <!-- Campo de Estrellas de Fondo Ligero -->
        @for (star of stars; track star.id) {
          <circle
            [attr.cx]="star.x"
            [attr.cy]="star.y"
            [attr.r]="star.r"
            fill="#ffffff"
            [attr.opacity]="star.opacity"
          />
        }

        <!-- Disparos Láser Gemelos (Vector puro de alto contraste sin filtros) -->
        @for (laser of lasers; track laser.id) {
          <g [attr.transform]="'translate(' + laser.x + ', ' + laser.y + ')'">
            <rect x="-2" y="-12" width="4" height="12" rx="2" fill="#38bdf8" />
            <rect x="-1" y="-11" width="2" height="10" rx="1" fill="#ffffff" />
          </g>
        }

        <!-- Enemigos (Asteroides y Naves Galaga) -->
        @for (enemy of enemies; track enemy.id) {
          <g [attr.transform]="'translate(' + enemy.x + ', ' + enemy.y + ') rotate(' + enemy.rotation + ')'">
            @if (enemy.type === 'asteroid') {
              <!-- Asteroide Poligonal Vectorial -->
              <g>
                <polygon
                  points="-16,-6 -8,-16 8,-15 16,-6 14,10 4,16 -10,13 -17,3"
                  fill="url(#asteroidGrad)"
                  stroke="#94a3b8"
                  stroke-width="1.2"
                />
                <circle cx="-4" cy="-4" r="3" fill="#334155" opacity="0.6" />
                <circle cx="5" cy="4" r="2.2" fill="#334155" opacity="0.6" />
              </g>
            } @else {
              <!-- Nave Invasora Galaga -->
              <g>
                <path
                  d="M 0 -13 L 13 -4 L 18 9 L 11 5 L 0 11 L -11 5 L -18 9 L -13 -4 Z"
                  fill="url(#alienGrad)"
                  stroke="#fb7185"
                  stroke-width="1.2"
                />
                <!-- Antenas -->
                <line x1="-7" y1="-11" x2="-12" y2="-18" stroke="#fb7185" stroke-width="1.2" />
                <circle cx="-12" cy="-18" r="1.5" fill="#f43f5e" />
                <line x1="7" y1="-11" x2="12" y2="-18" stroke="#fb7185" stroke-width="1.2" />
                <circle cx="12" cy="-18" r="1.5" fill="#f43f5e" />
                <!-- Núcleo de energía -->
                <circle cx="0" cy="0" r="4" fill="#fef08a" stroke="#e11d48" stroke-width="1" />
              </g>
            }

            <!-- Barra de vida si recibió daño parcial -->
            @if (enemy.hp < enemy.maxHp) {
              <rect x="-12" y="-22" width="24" height="2.5" rx="1.2" fill="#1e293b" />
              <rect
                x="-12"
                y="-22"
                [attr.width]="(enemy.hp / enemy.maxHp) * 24"
                height="2.5"
                rx="1.2"
                fill="#22c55e"
              />
            }
          </g>
        }

        <!-- Efectos de Explosión (Onda expansiva) -->
        @for (exp of explosions; track exp.id) {
          <g [attr.transform]="'translate(' + exp.x + ', ' + exp.y + ')'">
            <circle
              cx="0"
              cy="0"
              [attr.r]="exp.radius"
              fill="none"
              [attr.stroke]="exp.color"
              stroke-width="2"
              [attr.opacity]="exp.alpha"
            />
          </g>
        }

        <!-- Nave Caza del Jugador -->
        <g [attr.transform]="'translate(' + shipX + ', ' + shipY + ')'">
          <!-- Efecto de invulnerabilidad / Escudo -->
          @if (invulnerableTimer > 0) {
            <circle
              cx="0"
              cy="0"
              r="32"
              fill="none"
              stroke="#38bdf8"
              stroke-width="1.5"
              stroke-dasharray="6 4"
              [attr.opacity]="invulnerableFlash ? 0.9 : 0.2"
            />
          }

          <g [attr.opacity]="invulnerableTimer > 0 ? (invulnerableFlash ? 0.4 : 1) : 1">
            <!-- Fuego de los Propulsores Gemelos -->
            <g transform="translate(0, 16)">
              <polygon
                points="-8,0 -4,0 -6,14"
                fill="#f97316"
                [attr.transform]="'scale(1, ' + thrusterScale + ')'"
              />
              <polygon
                points="-7,0 -5,0 -6,7"
                fill="#fde047"
                [attr.transform]="'scale(1, ' + thrusterScale + ')'"
              />
              <polygon
                points="4,0 8,0 6,14"
                fill="#f97316"
                [attr.transform]="'scale(1, ' + thrusterScale + ')'"
              />
              <polygon
                points="5,0 7,0 6,7"
                fill="#fde047"
                [attr.transform]="'scale(1, ' + thrusterScale + ')'"
              />
            </g>

            <!-- Alas de la Nave -->
            <polygon
              points="0,-20 7,-2 24,13 16,16 6,13 0,15 -6,13 -16,16 -24,13 -7,-2"
              fill="url(#shipBodyGrad)"
              stroke="#0284c7"
              stroke-width="1.2"
            />

            <!-- Cañones en las puntas de las alas -->
            <rect x="-22" y="2" width="2.5" height="9" rx="1.2" fill="#0f172a" />
            <circle cx="-20.5" cy="2" r="1.8" fill="#38bdf8" />
            <rect x="19.5" y="2" width="2.5" height="9" rx="1.2" fill="#0f172a" />
            <circle cx="20.5" cy="2" r="1.8" fill="#38bdf8" />

            <!-- Cabina Neón -->
            <ellipse cx="0" cy="-3" rx="4" ry="8" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1" />
            <circle cx="-1" cy="-6" r="1.2" fill="#ffffff" />

            <!-- Acentos naranja EduBid -->
            <polygon points="0,-16 2.5,-9 -2.5,-9" fill="#f97316" />
          </g>
        </g>

        <!-- Textos Flotantes de Puntaje (+15, +30, -1 HP - Sin emojis) -->
        @for (ft of floatingTexts; track ft.id) {
          <text
            [attr.x]="ft.x"
            [attr.y]="ft.y"
            text-anchor="middle"
            font-size="12"
            font-weight="900"
            [attr.fill]="ft.color"
            [attr.opacity]="ft.alpha"
            font-family="sans-serif"
          >
            {{ ft.text }}
          </text>
        }
      </svg>
    </div>

    <!-- HUD Control flotante (Sin emojis) -->
    <app-game-hud
      gameTitle="Galaga Espacial"
      gameType="galaga"
      [score]="score()"
      [highScore]="highScore()"
      [lives]="lives()"
      [isGameOver]="isGameOver()"
      [isArcadeFocus]="isArcadeFocus()"
      (restart)="restartGame()"
      (toggleArcade)="toggleArcadeMode()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalagaGameComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('svgEl') svgElRef!: ElementRef<SVGSVGElement>;

  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private sound = inject(SoundService);

  readonly isArcadeFocus = input<boolean>(false);
  readonly closeArcade = output<void>();

  // Señales reactivas
  score = signal<number>(0);
  highScore = signal<number>(0);
  lives = signal<number>(3);
  isGameOver = signal<boolean>(false);

  viewWidth = signal<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  viewHeight = signal<number>(typeof window !== 'undefined' ? window.innerHeight : 800);

  // Estado mutable del juego a 60 FPS
  shipX = 400;
  shipY = 600;
  targetShipX = 400;
  targetShipY = 600;
  thrusterScale = 1;

  invulnerableTimer = 0;
  invulnerableFlash = false;

  lasers: Laser[] = [];
  enemies: Enemy[] = [];
  explosions: Explosion[] = [];
  floatingTexts: FloatingText[] = [];
  stars: Star[] = [];

  private nextLaserId = 1;
  private nextEnemyId = 1;
  private nextExpId = 1;
  private nextTextId = 1;

  private fireTimer = 0;
  private spawnTimer = 0;
  private gameTime = 0;

  private animFrameId: number | null = null;
  private lastTime = 0;
  private isDestroyed = false;

  private boundOnPointerMove = this.onPointerMove.bind(this);
  private boundOnResize = this.onResize.bind(this);

  ngOnInit(): void {
    this.loadHighScore();
    this.initStars();
  }

  ngAfterViewInit(): void {
    this.updateDimensions();
    this.shipX = this.viewWidth() / 2;
    this.shipY = this.viewHeight() - 90;
    this.targetShipX = this.shipX;
    this.targetShipY = this.shipY;

    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', this.boundOnPointerMove, { passive: true });
      window.addEventListener('resize', this.boundOnResize, { passive: true });
    }

    this.startGameLoop();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.boundOnPointerMove);
      window.removeEventListener('resize', this.boundOnResize);
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isArcadeFocus()) {
      this.closeArcade.emit();
      return;
    }

    if (this.isArcadeFocus() && !this.isGameOver()) {
      const step = 40;
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        this.targetShipX = Math.max(40, this.targetShipX - step);
      } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        this.targetShipX = Math.min(this.viewWidth() - 40, this.targetShipX + step);
      } else if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
        const minY = this.viewHeight() * 0.55;
        this.targetShipY = Math.max(minY, this.targetShipY - step);
      } else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
        this.targetShipY = Math.min(this.viewHeight() - 50, this.targetShipY + step);
      }
    }
  }

  private onPointerMove(event: PointerEvent): void {
    const w = this.viewWidth();
    const h = this.viewHeight();
    this.targetShipX = Math.max(40, Math.min(w - 40, event.clientX));
    const minY = h * 0.55;
    const maxY = h - 60;
    this.targetShipY = Math.max(minY, Math.min(maxY, event.clientY));
  }

  private onResize(): void {
    this.updateDimensions();
  }

  private updateDimensions(): void {
    if (typeof window === 'undefined') return;
    this.viewWidth.set(window.innerWidth);
    this.viewHeight.set(window.innerHeight);
  }

  private initStars(): void {
    const count = 18;
    const w = this.viewWidth();
    const h = this.viewHeight();
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        id: i,
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() > 0.75 ? 1.6 : 1,
        speed: 30 + Math.random() * 60,
        opacity: 0.2 + Math.random() * 0.5,
      });
    }
  }

  private loadHighScore(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('edubid_galaga_high_score');
      if (saved) {
        this.highScore.set(parseInt(saved, 10) || 0);
      }
    } catch {
      // Ignored
    }
  }

  private saveHighScore(score: number): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('edubid_galaga_high_score', String(score));
    } catch {
      // Ignored
    }
  }

  restartGame(): void {
    this.score.set(0);
    this.lives.set(3);
    this.isGameOver.set(false);
    this.lasers = [];
    this.enemies = [];
    this.explosions = [];
    this.floatingTexts = [];
    this.invulnerableTimer = 0;
    this.cdr.detectChanges();
  }

  toggleArcadeMode(): void {
    this.closeArcade.emit();
  }

  private startGameLoop(): void {
    this.ngZone.runOutsideAngular(() => {
      this.lastTime = performance.now();
      const loop = (currentTime: number) => {
        if (this.isDestroyed) return;
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        this.lastTime = currentTime;

        if (!this.isGameOver()) {
          this.updateGame(dt);
        }

        // Renderizado fluido a 60 FPS directo sobre el componente OnPush
        this.cdr.detectChanges();

        this.animFrameId = requestAnimationFrame(loop);
      };
      this.animFrameId = requestAnimationFrame(loop);
    });
  }

  private updateGame(dt: number): void {
    this.gameTime += dt;

    // 1. Movimiento suave del Caza
    const dx = this.targetShipX - this.shipX;
    const dy = this.targetShipY - this.shipY;
    this.shipX += dx * Math.min(1, dt * 14);
    this.shipY += dy * Math.min(1, dt * 14);

    this.thrusterScale = 0.85 + Math.random() * 0.4;

    // Invulnerabilidad
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.invulnerableFlash = Math.floor(this.invulnerableTimer * 10) % 2 === 0;
    }

    // 2. Movimiento de estrellas
    const h = this.viewHeight();
    const w = this.viewWidth();
    for (const star of this.stars) {
      star.y += star.speed * dt;
      if (star.y > h) {
        star.y = 0;
        star.x = Math.random() * w;
      }
    }

    // 3. Disparo Automático continuo (máximo 8 láseres activos)
    this.fireTimer += dt;
    if (this.fireTimer >= 0.24 && this.lasers.length < 8) {
      this.fireTimer = 0;
      this.fireLasers();
    }

    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.y += laser.vy * dt;
      if (laser.y < -25) {
        this.lasers.splice(i, 1);
      }
    }

    // 4. Spawner de Enemigos (máximo 4 concurrentes)
    this.spawnTimer += dt;
    const spawnInterval = Math.max(0.85, 1.6 - this.score() * 0.002);
    if (this.spawnTimer >= spawnInterval && this.enemies.length < 4) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // 5. Movimiento y Colisiones
    const shipHitboxRadius = 20;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.y += enemy.vy * dt;
      enemy.rotation += enemy.vRot * dt;

      if (enemy.type === 'galaga') {
        enemy.x = enemy.initialX + Math.sin(this.gameTime * 2.8 + enemy.phase) * 65;
      }

      // Colisión de Láseres
      for (let l = this.lasers.length - 1; l >= 0; l--) {
        const laser = this.lasers[l];
        const distSq = (laser.x - enemy.x) ** 2 + (laser.y - enemy.y) ** 2;
        if (distSq < (enemy.size + 4) ** 2) {
          this.lasers.splice(l, 1);
          enemy.hp--;

          if (enemy.hp <= 0) {
            this.destroyEnemy(enemy, i);
            break;
          } else {
            this.spawnExplosion(laser.x, laser.y, '#38bdf8', 10, 0.5);
          }
        }
      }

      // Colisión con Nave
      if (this.enemies[i]) {
        const playerDistSq = (this.shipX - enemy.x) ** 2 + (this.shipY - enemy.y) ** 2;
        if (playerDistSq < (shipHitboxRadius + enemy.size) ** 2) {
          if (this.invulnerableTimer <= 0) {
            this.hitPlayer();
          }
          this.destroyEnemy(enemy, i, false);
          continue;
        }

        if (enemy.y > h + 30) {
          this.enemies.splice(i, 1);
        }
      }
    }

    // 6. Explosiones
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.radius += (exp.maxRadius - exp.radius) * Math.min(1, dt * 16);
      exp.alpha -= dt * 2.8;
      if (exp.alpha <= 0) {
        this.explosions.splice(i, 1);
      }
    }

    // 7. Textos Flotantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 35 * dt;
      ft.alpha -= dt * 1.8;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private fireLasers(): void {
    this.lasers.push({
      id: this.nextLaserId++,
      x: this.shipX - 20,
      y: this.shipY + 2,
      vy: -750,
    });
    this.lasers.push({
      id: this.nextLaserId++,
      x: this.shipX + 20,
      y: this.shipY + 2,
      vy: -750,
    });
  }

  private spawnEnemy(): void {
    const w = this.viewWidth();
    const x = Math.random() * (w - 120) + 60;
    const isAlien = Math.random() > 0.45;

    if (isAlien) {
      this.enemies.push({
        id: this.nextEnemyId++,
        type: 'galaga',
        x,
        y: -30,
        initialX: x,
        vy: 160 + Math.random() * 40,
        hp: 2,
        maxHp: 2,
        rotation: 0,
        vRot: 0,
        size: 18,
        phase: Math.random() * Math.PI * 2,
        points: 30,
      });
    } else {
      this.enemies.push({
        id: this.nextEnemyId++,
        type: 'asteroid',
        x,
        y: -30,
        initialX: x,
        vy: 140 + Math.random() * 70,
        hp: 1,
        maxHp: 1,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 80,
        size: 16,
        phase: 0,
        points: 15,
      });
    }
  }

  private destroyEnemy(enemy: Enemy, index: number, awardPoints = true): void {
    if (awardPoints) {
      const newScore = this.score() + enemy.points;
      this.score.set(newScore);

      if (newScore > this.highScore()) {
        this.highScore.set(newScore);
        this.saveHighScore(newScore);
      }

      this.sound.playSuccess();

      this.floatingTexts.push({
        id: this.nextTextId++,
        text: `+${enemy.points}`,
        x: enemy.x,
        y: enemy.y - 12,
        color: enemy.type === 'galaga' ? '#f43f5e' : '#38bdf8',
        alpha: 1,
      });

      if (this.floatingTexts.length > 3) {
        this.floatingTexts.shift();
      }
    }

    this.spawnExplosion(
      enemy.x,
      enemy.y,
      enemy.type === 'galaga' ? '#fb7185' : '#94a3b8',
      enemy.size * 1.6,
      1
    );

    this.enemies.splice(index, 1);
  }

  private hitPlayer(): void {
    this.invulnerableTimer = 1.4;
    const currentLives = this.lives() - 1;
    this.lives.set(currentLives);

    this.sound.playAlert();

    // Sin emojis: '-1 HP'
    this.floatingTexts.push({
      id: this.nextTextId++,
      text: '-1 HP',
      x: this.shipX,
      y: this.shipY - 20,
      color: '#ef4444',
      alpha: 1,
    });

    if (this.floatingTexts.length > 3) {
      this.floatingTexts.shift();
    }

    this.spawnExplosion(this.shipX, this.shipY, '#ef4444', 35, 1);

    if (currentLives <= 0) {
      this.isGameOver.set(true);
    }
  }

  private spawnExplosion(x: number, y: number, color: string, maxRadius: number, alpha: number): void {
    this.explosions.push({
      id: this.nextExpId++,
      x,
      y,
      radius: 4,
      maxRadius,
      alpha,
      color,
    });

    if (this.explosions.length > 8) {
      this.explosions.shift();
    }
  }
}
