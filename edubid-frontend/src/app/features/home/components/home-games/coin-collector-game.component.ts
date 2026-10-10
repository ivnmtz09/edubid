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

interface FallingItem {
  id: number;
  type: 'coin' | 'super' | 'bomb';
  x: number;
  y: number;
  vy: number;
  rotation: number;
  vRot: number;
  size: number;
  scaleX: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

@Component({
  selector: 'app-coin-collector-game',
  standalone: true,
  imports: [CommonModule, GameHudComponent],
  template: `
    <!-- Contenedor Principal del Juego (SVG de fondo o interactivo en modo Arcade) -->
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
          <!-- Gradientes Vectoriales Ligeros (Sin filtros Gaussianos para 60 FPS estables) -->
          <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="40%" stop-color="#eab308" />
            <stop offset="100%" stop-color="#ca8a04" />
          </linearGradient>

          <linearGradient id="superCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f472b6" />
            <stop offset="50%" stop-color="#ec4899" />
            <stop offset="100%" stop-color="#be185d" />
          </linearGradient>

          <linearGradient id="cartWoodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#b45309" />
            <stop offset="50%" stop-color="#78350f" />
            <stop offset="100%" stop-color="#451a03" />
          </linearGradient>

          <linearGradient id="bombGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#64748b" />
            <stop offset="60%" stop-color="#1e293b" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
        </defs>

        <!-- Piso / Suelo Vectorial con estilo institucional -->
        <g [attr.transform]="'translate(0, ' + groundY() + ')'">
          <line
            x1="0"
            y1="0"
            [attr.x2]="viewWidth()"
            y2="0"
            stroke="currentColor"
            class="text-amber-500/30 dark:text-amber-400/25"
            stroke-width="2.5"
            stroke-dasharray="12 6"
          />
          <rect
            x="0"
            y="2"
            [attr.width]="viewWidth()"
            height="120"
            fill="currentColor"
            class="text-amber-500/5 dark:text-amber-400/5"
          />
        </g>

        <!-- Partículas de recolección -->
        @for (p of particles; track p.id) {
          <circle
            [attr.cx]="p.x"
            [attr.cy]="p.y"
            [attr.r]="p.size"
            [attr.fill]="p.color"
            [attr.opacity]="p.alpha"
          />
        }

        <!-- Objetos que caen del cielo (Monedas y Bombas - Vector puro sin filtros ni emojis) -->
        @for (item of items; track item.id) {
          <g [attr.transform]="'translate(' + item.x + ', ' + item.y + ') rotate(' + item.rotation + ')'">
            @if (item.type === 'coin') {
              <!-- Moneda EduCoin Estándar -->
              <g [attr.transform]="'scale(' + item.scaleX + ', 1)'">
                <circle cx="0" cy="0" [attr.r]="item.size" fill="url(#coinGrad)" stroke="#a16207" stroke-width="1.5" />
                <circle cx="0" cy="0" [attr.r]="item.size * 0.72" fill="none" stroke="#fef08a" stroke-width="1" stroke-dasharray="3 2" />
                <text
                  x="0"
                  y="4"
                  text-anchor="middle"
                  font-size="11"
                  font-weight="900"
                  fill="#78350f"
                  font-family="sans-serif"
                >
                  E
                </text>
              </g>
            } @else if (item.type === 'super') {
              <!-- Super Moneda EduBid con Estrella Vectorial -->
              <g [attr.transform]="'scale(' + item.scaleX + ', 1)'">
                <circle cx="0" cy="0" [attr.r]="item.size" fill="url(#superCoinGrad)" stroke="#fda4af" stroke-width="2" />
                <polygon
                  points="0,-8 2.5,-2.5 8,0 2.5,2.5 0,8 -2.5,2.5 -8,0 -2.5,-2.5"
                  fill="#ffffff"
                />
              </g>
            } @else {
              <!-- Bomba de Peligro Vectorial (Sin emojis) -->
              <g>
                <!-- Mecha -->
                <path d="M 0 -12 Q 5 -18 8 -22" fill="none" stroke="#92400e" stroke-width="2" />
                <!-- Chispa de la mecha -->
                <circle cx="8" cy="-22" r="3" fill="#f97316" />
                <circle cx="8" cy="-22" r="1.5" fill="#fde047" />
                <!-- Cuerpo de la bomba -->
                <circle cx="0" cy="0" [attr.r]="item.size" fill="url(#bombGrad)" stroke="#0f172a" stroke-width="1.5" />
                <!-- Brillo especular -->
                <circle cx="-4" cy="-4" r="3" fill="#ffffff" opacity="0.3" />
                <!-- Símbolo de calavera vectorial en SVG -->
                <g fill="#ef4444" transform="scale(0.8) translate(-5, -6)">
                  <circle cx="6" cy="4" r="4.5" />
                  <rect x="3.5" y="6" width="5" height="4" rx="1" />
                  <circle cx="4.5" cy="4" r="1" fill="#0f172a" />
                  <circle cx="7.5" cy="4" r="1" fill="#0f172a" />
                </g>
              </g>
            }
          </g>
        }

        <!-- Stickman con Carreta Vectorial -->
        <g [attr.transform]="'translate(' + playerX + ', ' + groundY() + ') scale(' + facingDirection + ', 1)'">
          <!-- Sombra en el suelo -->
          <ellipse cx="12" cy="0" rx="36" ry="5" fill="#000000" opacity="0.2" />

          <!-- Parpadeo al recibir daño -->
          <g [attr.opacity]="invulnerableTimer > 0 ? (invulnerableFlash ? 0.3 : 1) : 1">
            <!-- Carreta de madera dorada -->
            <g id="cart">
              <!-- Cuerpo de la carreta -->
              <path
                d="M 12 -28 L 52 -28 L 46 -6 L 16 -6 Z"
                fill="url(#cartWoodGrad)"
                stroke="#d97706"
                stroke-width="1.5"
              />
              <line x1="10" y1="-28" x2="54" y2="-28" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" />
              <line x1="26" y1="-28" x2="28" y2="-6" stroke="#b45309" stroke-width="1" />
              <line x1="38" y1="-28" x2="36" y2="-6" stroke="#b45309" stroke-width="1" />
              
              <!-- Monedas visibles dentro de la carreta -->
              @if (score() > 0) {
                <circle cx="28" cy="-22" r="4.5" fill="#fde047" stroke="#ca8a04" stroke-width="0.8" />
                <circle cx="36" cy="-24" r="5" fill="#facc15" stroke="#ca8a04" stroke-width="0.8" />
                <circle cx="43" cy="-20" r="4.5" fill="#eab308" stroke="#ca8a04" stroke-width="0.8" />
              }

              <!-- Mango -->
              <line x1="6" y1="-22" x2="14" y2="-24" stroke="#78350f" stroke-width="2" stroke-linecap="round" />

              <!-- Ruedas giratorias con radios -->
              <g [attr.transform]="'translate(23, -4) rotate(' + wheelRotation + ')'">
                <circle cx="0" cy="0" r="6" fill="#451a03" stroke="#f59e0b" stroke-width="1.2" />
                <circle cx="0" cy="0" r="2" fill="#fde047" />
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#f59e0b" stroke-width="1" />
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#f59e0b" stroke-width="1" />
              </g>

              <g [attr.transform]="'translate(43, -4) rotate(' + wheelRotation + ')'">
                <circle cx="0" cy="0" r="6" fill="#451a03" stroke="#f59e0b" stroke-width="1.2" />
                <circle cx="0" cy="0" r="2" fill="#fde047" />
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#f59e0b" stroke-width="1" />
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#f59e0b" stroke-width="1" />
              </g>
            </g>

            <!-- Stickman -->
            <!-- Cabeza -->
            <circle
              cx="-10"
              cy="-48"
              r="10"
              fill="#ffffff"
              stroke="#0f172a"
              class="dark:stroke-slate-100"
              stroke-width="2.5"
            />
            <!-- Visera EduBid naranja -->
            <path d="M -16 -53 Q -10 -58 0 -52" fill="none" stroke="#f97316" stroke-width="3" stroke-linecap="round" />
            <!-- Ojo -->
            <circle cx="-7" cy="-48" r="1.5" fill="#0f172a" />
            <!-- Sonrisa -->
            <path d="M -8 -44 Q -6 -41 -4 -44" fill="none" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round" />

            <!-- Torso -->
            <line
              x1="-10"
              y1="-38"
              x2="-10"
              y2="-18"
              stroke="#0f172a"
              class="dark:stroke-slate-100"
              stroke-width="2.5"
              stroke-linecap="round"
            />

            <!-- Brazo -->
            <polyline
              points="-10,-32 -2,-26 8,-22"
              fill="none"
              stroke="#0f172a"
              class="dark:stroke-slate-100"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Piernas animadas en ciclo de carrera -->
            <line
              x1="-10"
              y1="-18"
              [attr.x2]="legBackX"
              [attr.y2]="legBackY"
              stroke="#0f172a"
              class="dark:stroke-slate-100"
              stroke-width="2.5"
              stroke-linecap="round"
            />
            <line
              x1="-10"
              y1="-18"
              [attr.x2]="legFrontX"
              [attr.y2]="legFrontY"
              stroke="#0f172a"
              class="dark:stroke-slate-100"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </g>
        </g>

        <!-- Textos Flotantes de Puntaje (+10, +50, -1 HP - Sin emojis) -->
        @for (ft of floatingTexts; track ft.id) {
          <text
            [attr.x]="ft.x"
            [attr.y]="ft.y"
            text-anchor="middle"
            font-size="13"
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
      gameTitle="Recolector de Monedas"
      gameType="coins"
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
export class CoinCollectorGameComponent implements OnInit, AfterViewInit, OnDestroy {
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
  groundY = signal<number>(typeof window !== 'undefined' ? window.innerHeight - 60 : 740);

  // Estado mutable del Game Loop (RAF a 60 FPS continuos)
  playerX = 300;
  targetPlayerX = 300;
  facingDirection = 1;
  wheelRotation = 0;
  runPhase = 0;

  legFrontX = -10;
  legFrontY = -2;
  legBackX = -10;
  legBackY = -2;

  invulnerableTimer = 0;
  invulnerableFlash = false;

  items: FallingItem[] = [];
  particles: Particle[] = [];
  floatingTexts: FloatingText[] = [];

  private nextItemId = 1;
  private nextParticleId = 1;
  private nextTextId = 1;
  private spawnTimer = 0;

  private animFrameId: number | null = null;
  private lastTime = 0;
  private isDestroyed = false;

  private boundOnPointerMove = this.onPointerMove.bind(this);
  private boundOnResize = this.onResize.bind(this);

  ngOnInit(): void {
    this.loadHighScore();
  }

  ngAfterViewInit(): void {
    this.updateDimensions();
    this.playerX = this.viewWidth() / 2;
    this.targetPlayerX = this.playerX;

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
      const step = 45;
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        this.targetPlayerX = Math.max(60, this.targetPlayerX - step);
      } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        this.targetPlayerX = Math.min(this.viewWidth() - 60, this.targetPlayerX + step);
      }
    }
  }

  private onPointerMove(event: PointerEvent): void {
    this.targetPlayerX = Math.max(60, Math.min(this.viewWidth() - 80, event.clientX));
  }

  private onResize(): void {
    this.updateDimensions();
  }

  private updateDimensions(): void {
    if (typeof window === 'undefined') return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.viewWidth.set(w);
    this.viewHeight.set(h);
    this.groundY.set(h - 60);
  }

  private loadHighScore(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('edubid_coins_high_score');
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
      localStorage.setItem('edubid_coins_high_score', String(score));
    } catch {
      // Ignored
    }
  }

  restartGame(): void {
    this.score.set(0);
    this.lives.set(3);
    this.isGameOver.set(false);
    this.items = [];
    this.particles = [];
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
    // 1. Movimiento suave del jugador hacia targetPlayerX
    const dx = this.targetPlayerX - this.playerX;
    const speed = Math.abs(dx);
    const vx = dx * Math.min(1, dt * 12);
    this.playerX += vx;

    // Orientación
    if (vx > 1.5) {
      this.facingDirection = 1;
    } else if (vx < -1.5) {
      this.facingDirection = -1;
    }

    // Rotación de ruedas y animación de piernas
    if (speed > 1) {
      this.wheelRotation = (this.wheelRotation + vx * 2.5) % 360;
      this.runPhase += speed * dt * 0.18;
    }

    const legSwing = Math.sin(this.runPhase) * 11;
    this.legFrontX = -10 + legSwing;
    this.legFrontY = -2 - Math.abs(Math.cos(this.runPhase)) * 3.5;
    this.legBackX = -10 - legSwing;
    this.legBackY = -2 - Math.abs(Math.sin(this.runPhase)) * 3.5;

    // Invulnerabilidad
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.invulnerableFlash = Math.floor(this.invulnerableTimer * 12) % 2 === 0;
    }

    // 2. Generación de objetos (máximo 6 concurrentes para máxima ligereza)
    this.spawnTimer += dt;
    const spawnInterval = Math.max(0.75, 1.4 - this.score() * 0.002);
    if (this.spawnTimer >= spawnInterval && this.items.length < 6) {
      this.spawnTimer = 0;
      this.spawnItem();
    }

    // 3. Actualización de objetos y colisiones
    const ground = this.groundY();
    const cartCenterX = this.playerX + this.facingDirection * 32;
    const cartCenterY = ground - 18;
    const cartHalfW = 28;
    const cartHalfH = 16;

    const manCenterX = this.playerX - this.facingDirection * 10;
    const manCenterY = ground - 30;
    const manHalfW = 16;
    const manHalfH = 30;

    const now = performance.now() * 0.004;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.y += item.vy * dt;
      item.rotation += item.vRot * dt;
      item.scaleX = Math.cos(now + item.id);

      // Colisión con Carreta
      const hitCart =
        Math.abs(item.x - cartCenterX) < cartHalfW + item.size &&
        Math.abs(item.y - cartCenterY) < cartHalfH + item.size;

      // Colisión con Stickman
      const hitMan =
        Math.abs(item.x - manCenterX) < manHalfW + item.size &&
        Math.abs(item.y - manCenterY) < manHalfH + item.size;

      if (hitCart || hitMan) {
        if (item.type === 'coin' || item.type === 'super') {
          const points = item.type === 'super' ? 50 : 10;
          this.collectCoin(item, points);
          this.items.splice(i, 1);
          continue;
        } else if (item.type === 'bomb') {
          if (this.invulnerableTimer <= 0) {
            this.hitBomb(item);
          }
          this.items.splice(i, 1);
          continue;
        }
      }

      // Suelo
      if (item.y > ground + 15) {
        if (item.type === 'bomb') {
          this.spawnExplosion(item.x, ground, '#64748b', 3);
        }
        this.items.splice(i, 1);
      }
    }

    // 4. Actualización de partículas (máximo 12)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      p.alpha -= dt * 2.2;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 5. Actualización de textos flotantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 40 * dt;
      ft.alpha -= dt * 1.6;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private spawnItem(): void {
    const w = this.viewWidth();
    const x = Math.random() * (w - 140) + 70;
    const rand = Math.random();

    let type: 'coin' | 'super' | 'bomb' = 'coin';
    let vy = 210 + Math.random() * 80;
    let size = 13;

    if (rand < 0.22) {
      type = 'bomb';
      vy = 230 + Math.random() * 80;
      size = 14;
    } else if (rand < 0.35) {
      type = 'super';
      vy = 260 + Math.random() * 70;
      size = 15;
    }

    this.items.push({
      id: this.nextItemId++,
      type,
      x,
      y: -20,
      vy,
      rotation: 0,
      vRot: (Math.random() - 0.5) * 90,
      size,
      scaleX: 1,
    });
  }

  private collectCoin(item: FallingItem, points: number): void {
    const newScore = this.score() + points;
    this.score.set(newScore);

    if (newScore > this.highScore()) {
      this.highScore.set(newScore);
      this.saveHighScore(newScore);
    }

    this.sound.playSuccess();

    // Texto flotante (sin emojis)
    this.floatingTexts.push({
      id: this.nextTextId++,
      text: `+${points}`,
      x: item.x,
      y: item.y - 10,
      color: points === 50 ? '#ec4899' : '#eab308',
      alpha: 1,
    });

    if (this.floatingTexts.length > 3) {
      this.floatingTexts.shift();
    }

    this.spawnExplosion(item.x, item.y, points === 50 ? '#f43f5e' : '#facc15', 6);
  }

  private hitBomb(item: FallingItem): void {
    this.invulnerableTimer = 1.3;
    const currentLives = this.lives() - 1;
    this.lives.set(currentLives);

    this.sound.playAlert();

    // Texto flotante de daño (sin emojis)
    this.floatingTexts.push({
      id: this.nextTextId++,
      text: '-1 HP',
      x: item.x,
      y: item.y - 10,
      color: '#ef4444',
      alpha: 1,
    });

    if (this.floatingTexts.length > 3) {
      this.floatingTexts.shift();
    }

    this.spawnExplosion(item.x, item.y, '#f97316', 10);

    if (currentLives <= 0) {
      this.isGameOver.set(true);
    }
  }

  private spawnExplosion(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 50 + Math.random() * 90;
      this.particles.push({
        id: this.nextParticleId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 35,
        alpha: 1,
        color,
        size: 2 + Math.random() * 2.5,
      });
    }

    if (this.particles.length > 16) {
      this.particles.splice(0, this.particles.length - 16);
    }
  }
}
