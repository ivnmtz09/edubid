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
  bankAngle?: number;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  stage: number;
}

interface FloatingBadge {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  borderColor: string;
  alpha: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  r: number;
  layer: 1 | 2 | 3;
  speed: number;
  opacity: number;
  twinklePhase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
}

interface IonParticle {
  id: number;
  x: number;
  y: number;
  vy: number;
  alpha: number;
  size: number;
}

interface RockDebris {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  size: number;
  alpha: number;
  color: string;
}

@Component({
  selector: 'app-galaga-game',
  standalone: true,
  imports: [CommonModule, GameHudComponent],
  host: {
    class: 'block w-full h-full',
  },
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
          <!-- 1. Caza Estelar Interceptor: Titanio Pulido y Blindaje Angular -->
          <linearGradient id="shipArmorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="25%" stop-color="#0284c7" />
            <stop offset="65%" stop-color="#0369a1" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>

          <linearGradient id="shipWingTrim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#7dd3fc" />
            <stop offset="50%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#075985" />
          </linearGradient>

          <linearGradient id="canopyGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#e0f2fe" />
            <stop offset="40%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#0369a1" />
          </linearGradient>

          <!-- 2. Disparos Láser Neón de Plasma Gemelos -->
          <linearGradient id="plasmaBoltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="35%" stop-color="#67e8f9" />
            <stop offset="70%" stop-color="#0ea5e9" />
            <stop offset="100%" stop-color="#0284c7" />
          </linearGradient>

          <!-- 3. Invasor Alienígena Biomecánico: Carapacho Quirúrgico y Núcleo Rubí -->
          <linearGradient id="alienChitinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fda4af" />
            <stop offset="30%" stop-color="#f43f5e" />
            <stop offset="70%" stop-color="#be123c" />
            <stop offset="100%" stop-color="#4c0519" />
          </linearGradient>

          <radialGradient id="rubyCoreGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="35%" stop-color="#f43f5e" />
            <stop offset="75%" stop-color="#e11d48" />
            <stop offset="100%" stop-color="#881337" />
          </radialGradient>

          <!-- 4. Asteroide Poligonal con Sombras de Cráter -->
          <linearGradient id="asteroidRockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#94a3b8" />
            <stop offset="40%" stop-color="#64748b" />
            <stop offset="80%" stop-color="#334155" />
            <stop offset="100%" stop-color="#1e293b" />
          </linearGradient>

          <!-- 5. Nebulosas Cósmicas Suaves SVG de Fondo -->
          <radialGradient id="nebulaViolet" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.14" />
            <stop offset="50%" stop-color="#4f46e5" stop-opacity="0.07" />
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
          </radialGradient>

          <radialGradient id="nebulaCyan" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.12" />
            <stop offset="60%" stop-color="#083344" stop-opacity="0.05" />
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
          </radialGradient>

          <!-- Gradiente Estrella Fugaz -->
          <linearGradient id="shootingStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
            <stop offset="40%" stop-color="#67e8f9" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
          </linearGradient>
        </defs>

        <!-- Nebulosas Cósmicas Suaves de Fondo Parallax -->
        <ellipse cx="28%" cy="32%" rx="380" ry="240" fill="url(#nebulaViolet)" />
        <ellipse cx="78%" cy="68%" rx="440" ry="280" fill="url(#nebulaCyan)" />

        <!-- Campo de Estrellas Parallax Multicapa (Capas 1, 2 y 3) -->
        @for (star of stars; track star.id) {
          <circle
            [attr.cx]="star.x"
            [attr.cy]="star.y"
            [attr.r]="star.r"
            [attr.fill]="star.layer === 2 ? '#bae6fd' : '#ffffff'"
            [attr.opacity]="star.opacity"
          />
        }

        <!-- Estrella Fugaz Ocasional en Órbita -->
        @if (shootingStar) {
          <line
            [attr.x1]="shootingStar.x"
            [attr.y1]="shootingStar.y"
            [attr.x2]="shootingStar.x - shootingStar.vx * 0.04"
            [attr.y2]="shootingStar.y - shootingStar.vy * 0.04"
            stroke="url(#shootingStarGrad)"
            stroke-width="2.5"
            stroke-linecap="round"
            [attr.opacity]="shootingStar.alpha"
          />
        }

        <!-- Estelas de Partículas de Humo / Plasma Iónico del Motor -->
        @for (ion of ionParticles; track ion.id) {
          <circle
            [attr.cx]="ion.x"
            [attr.cy]="ion.y"
            [attr.r]="ion.size"
            fill="#38bdf8"
            [attr.opacity]="ion.alpha"
          />
        }

        <!-- Fragmentos y Rocas de Escombros de Asteroides Destruidos -->
        @for (debris of rockDebrisList; track debris.id) {
          <polygon
            [attr.transform]="'translate(' + debris.x + ', ' + debris.y + ') rotate(' + debris.rotation + ')'"
            [attr.points]="'-' + debris.size + ',-' + (debris.size * 0.5) + ' ' + (debris.size * 0.7) + ',-' + debris.size + ' ' + debris.size + ',' + (debris.size * 0.6) + ' -' + (debris.size * 0.4) + ',' + debris.size"
            [attr.fill]="debris.color"
            stroke="#94a3b8"
            stroke-width="0.8"
            [attr.opacity]="debris.alpha"
          />
        }

        <!-- Disparos Láser Gemelos de Plasma con Núcleo Incandescente -->
        @for (laser of lasers; track laser.id) {
          <g [attr.transform]="'translate(' + laser.x + ', ' + laser.y + ')'">
            <!-- Resplandor exterior neón -->
            <rect x="-3.5" y="-18" width="7" height="20" rx="3.5" fill="#0ea5e9" opacity="0.35" />
            <!-- Cuerpo cónico de plasma -->
            <polygon points="-2.5,2 0,-18 2.5,2 0,6" fill="url(#plasmaBoltGrad)" />
            <!-- Núcleo incandescente de alta energía -->
            <rect x="-1" y="-15" width="2" height="15" rx="1" fill="#ffffff" />
            <!-- Estela de condensación trasera -->
            <line x1="0" y1="4" x2="0" y2="12" stroke="#38bdf8" stroke-width="1.8" opacity="0.5" stroke-linecap="round" />
          </g>
        }

        <!-- Enemigos (Asteroides Cragosos y Naves Invasoras Biomecánicas) -->
        @for (enemy of enemies; track enemy.id) {
          <g [attr.transform]="'translate(' + enemy.x + ', ' + enemy.y + ') rotate(' + (enemy.rotation + (enemy.bankAngle || 0)) + ')'">
            @if (enemy.type === 'asteroid') {
              <!-- Asteroide Poligonal Cragoso con Cráteres y Relieve -->
              <g>
                <!-- Cara iluminada y base poligonal -->
                <polygon
                  points="-18,-8 -10,-19 5,-18 18,-8 19,7 10,18 -5,19 -17,11 -21,1"
                  fill="url(#asteroidRockGrad)"
                  stroke="#94a3b8"
                  stroke-width="1.2"
                />
                
                <!-- Facetas de sombreado angular 3D -->
                <polygon points="-10,-19 0,-2 18,-8 5,-18" fill="#cbd5e1" opacity="0.25" />
                <polygon points="0,-2 10,18 -5,19 -17,11" fill="#0f172a" opacity="0.35" />
                <polygon points="18,-8 19,7 10,18 0,-2" fill="#1e293b" opacity="0.45" />

                <!-- Cráteres con sombras interiores y bordes destacados -->
                <circle cx="-6" cy="-6" r="3.6" fill="#1e293b" stroke="#64748b" stroke-width="0.8" />
                <circle cx="-6" cy="-6" r="2.2" fill="#0f172a" />
                <circle cx="7" cy="4" r="2.8" fill="#1e293b" stroke="#64748b" stroke-width="0.8" />
                <circle cx="7" cy="4" r="1.6" fill="#0f172a" />
                <circle cx="-3" cy="9" r="2" fill="#1e293b" stroke="#475569" stroke-width="0.6" />
              </g>
            } @else {
              <!-- Nave Invasora Biomecánica con Mandíbulas Articuladas y Núcleo Rubí -->
              <g>
                <!-- Mandíbulas / Pinzas articuladas delanteras -->
                <path
                  [attr.d]="'M -7 -8 C -13 -13 -12 -21 ' + (-5 + alienPincerFlex) + ' -24 C -9 -19 -10 -12 -5 -6 Z'"
                  fill="#f43f5e"
                  stroke="#fda4af"
                  stroke-width="0.8"
                />
                <path
                  [attr.d]="'M 7 -8 C 13 -13 12 -21 ' + (5 - alienPincerFlex) + ' -24 C 9 -19 10 -12 5 -6 Z'"
                  fill="#f43f5e"
                  stroke="#fda4af"
                  stroke-width="0.8"
                />

                <!-- Carapacho Quitinoso Segmentado con Alerones -->
                <path
                  d="M 0 -15 L 14 -5 L 21 8 L 13 6 L 0 13 L -13 6 L -21 8 L -14 -5 Z"
                  fill="url(#alienChitinGrad)"
                  stroke="#fb7185"
                  stroke-width="1.3"
                />

                <!-- Ranuras de ventilación bio-mecánica -->
                <line x1="-12" y1="1" x2="-6" y2="3" stroke="#fda4af" stroke-width="1.2" />
                <line x1="12" y1="1" x2="6" y2="3" stroke="#fda4af" stroke-width="1.2" />
                <line x1="-14" y1="-3" x2="-8" y2="-1" stroke="#fda4af" stroke-width="1.2" />
                <line x1="14" y1="-3" x2="8" y2="-1" stroke="#fda4af" stroke-width="1.2" />

                <!-- Placas dorsales secundarias -->
                <polygon points="0,-10 6,-2 0,4 -6,-2" fill="#9f1239" stroke="#f43f5e" stroke-width="0.8" />

                <!-- Núcleo de Energía de Plasma Rubí Pulsante -->
                <circle
                  cx="0"
                  cy="0"
                  [attr.r]="alienCoreRadius"
                  fill="url(#rubyCoreGrad)"
                  stroke="#ffffff"
                  stroke-width="1"
                />
              </g>
            }

            <!-- Barra de Vida para unidades dañadas -->
            @if (enemy.hp < enemy.maxHp) {
              <rect x="-14" y="-25" width="28" height="3" rx="1.5" fill="#0f172a" stroke="#ffffff20" stroke-width="0.5" />
              <rect
                x="-14"
                y="-25"
                [attr.width]="(enemy.hp / enemy.maxHp) * 28"
                height="3"
                rx="1.5"
                fill="#22c55e"
              />
            }
          </g>
        }

        <!-- Explosiones de Ondas de Choque Multietapa y Ráfaga de Plasma -->
        @for (exp of explosions; track exp.id) {
          <g [attr.transform]="'translate(' + exp.x + ', ' + exp.y + ')'">
            <!-- Onda de choque primaria de alta energía -->
            <circle
              cx="0"
              cy="0"
              [attr.r]="exp.radius"
              fill="none"
              [attr.stroke]="exp.color"
              stroke-width="2.2"
              [attr.opacity]="exp.alpha"
            />
            <!-- Onda secundaria de plasma denso -->
            <circle
              cx="0"
              cy="0"
              [attr.r]="exp.radius * 0.65"
              fill="none"
              stroke="#ffffff"
              stroke-width="1.5"
              [attr.opacity]="exp.alpha * 0.75"
            />
            <!-- Ráfaga central -->
            @if (exp.alpha > 0.5) {
              <circle
                cx="0"
                cy="0"
                [attr.r]="exp.radius * 0.3"
                [attr.fill]="exp.color"
                [attr.opacity]="exp.alpha * 0.6"
              />
            }
          </g>
        }

        <!-- Nave Caza Estelar Interceptor del Jugador -->
        <g [attr.transform]="'translate(' + shipX + ', ' + shipY + ') rotate(' + shipBankAngle + ')'">
          <!-- Escudo de Energía Hexagonal y Circular Luminoso en Invulnerabilidad -->
          @if (invulnerableTimer > 0) {
            <g>
              <!-- Anillo exterior del escudo con pulsación -->
              <circle
                cx="0"
                cy="0"
                r="36"
                fill="none"
                stroke="#38bdf8"
                stroke-width="2"
                stroke-dasharray="14 7"
                [attr.transform]="'rotate(' + shieldRotation + ')'"
                [attr.opacity]="invulnerableFlash ? 0.95 : 0.3"
              />
              <!-- Campo de energía translúcido -->
              <circle
                cx="0"
                cy="0"
                r="34"
                fill="#38bdf8"
                [attr.opacity]="invulnerableFlash ? 0.2 : 0.05"
              />
              <!-- Patrón de blindaje geométrico / hexágono interior -->
              <polygon
                points="0,-33 28,-16 28,16 0,33 -28,16 -28,-16"
                fill="none"
                stroke="#67e8f9"
                stroke-width="1"
                stroke-dasharray="6 4"
                [attr.opacity]="invulnerableFlash ? 0.7 : 0.2"
              />
            </g>
          }

          <g [attr.opacity]="invulnerableTimer > 0 ? (invulnerableFlash ? 0.45 : 1) : 1">
            <!-- ============================================== -->
            <!-- PROPULSORES GEMELOS Y LLAMAS DE PLASMA DUALES -->
            <!-- ============================================== -->
            <g transform="translate(0, 16)">
              <!-- Motor Izquierdo: Envoltura cian, llama media y núcleo incandescente -->
              <polygon
                points="-9,0 -4,0 -6.5,17"
                fill="#0284c7"
                [attr.transform]="'scale(1, ' + thrusterScale + ')'"
              />
              <polygon
                points="-8.5,0 -4.5,0 -6.5,13"
                fill="#38bdf8"
                [attr.transform]="'scale(1, ' + thrusterScale + ')'"
              />
              <polygon
                points="-7.5,0 -5.5,0 -6.5,7"
                fill="#ffffff"
                [attr.transform]="'scale(1, ' + thrusterScale + ')'"
              />

              <!-- Motor Derecho -->
              <polygon
                points="4,0 9,0 6.5,17"
                fill="#0284c7"
                [attr.transform]="'scale(1, ' + thrusterScale + ')'"
              />
              <polygon
                points="4.5,0 8.5,0 6.5,13"
                fill="#38bdf8"
                [attr.transform]="'scale(1, ' + thrusterScale + ')'"
              />
              <polygon
                points="5.5,0 7.5,0 6.5,7"
                fill="#ffffff"
                [attr.transform]="'scale(1, ' + thrusterScale + ')'"
              />
            </g>

            <!-- ============================================== -->
            <!-- FUSELAJE Y ALAS DELTA ESCALONADAS DEL CAZA     -->
            <!-- ============================================== -->
            <!-- Alas Delta con Blindaje Angular y Paneles Biselados -->
            <polygon
              points="0,-22 8,-2 26,14 17,18 7,14 0,16 -7,14 -17,18 -26,14 -8,-2"
              fill="url(#shipArmorGrad)"
              stroke="#0284c7"
              stroke-width="1.3"
            />

            <!-- Placas de Blindaje Superiores y Líneas de Panel -->
            <polygon
              points="0,-18 6,0 18,12 11,14 5,11 0,13 -5,11 -11,14 -18,12 -6,0"
              fill="url(#shipWingTrim)"
              stroke="#38bdf8"
              stroke-width="0.8"
            />

            <!-- Canards / Estabilizadores de Morro -->
            <polygon points="0,-14 6,-7 0,-4 -6,-7" fill="#0f172a" stroke="#38bdf8" stroke-width="0.8" />

            <!-- Acentos naranja característicos de EduBid en las alas -->
            <polygon points="-12,5 -18,10 -15,11 -10,6" fill="#f97316" />
            <polygon points="12,5 18,10 15,11 10,6" fill="#f97316" />

            <!-- Cañones de Pulso Gemelos en las Puntas de las Alas -->
            <!-- Pylón Izquierdo -->
            <rect x="-24.5" y="1" width="3.2" height="11" rx="1.5" fill="#0f172a" stroke="#0284c7" stroke-width="0.8" />
            <circle cx="-23" cy="1" r="2.2" fill="#38bdf8" stroke="#ffffff" stroke-width="0.8" />
            <!-- Pylón Derecho -->
            <rect x="21.5" y="1" width="3.2" height="11" rx="1.5" fill="#0f172a" stroke="#0284c7" stroke-width="0.8" />
            <circle cx="23" cy="1" r="2.2" fill="#38bdf8" stroke="#ffffff" stroke-width="0.8" />

            <!-- Destellos de Disparo en Cañones (Muzzle Flash) -->
            @if (muzzleFlashTimer > 0) {
              <circle cx="-23" cy="-1" r="5.5" fill="#38bdf8" opacity="0.85" />
              <circle cx="-23" cy="-1" r="2.8" fill="#ffffff" />
              <circle cx="23" cy="-1" r="5.5" fill="#38bdf8" opacity="0.85" />
              <circle cx="23" cy="-1" r="2.8" fill="#ffffff" />
            }

            <!-- Cabina Neón con Reflejos de Cristal y HUD Interior -->
            <ellipse cx="0" cy="-3" rx="4.5" ry="9" fill="url(#canopyGlassGrad)" stroke="#67e8f9" stroke-width="1.2" />
            
            <!-- Franja especular curva en la cúpula de cristal -->
            <path
              d="M -1.8 -8 Q 1.5 -3 -1 4"
              fill="none"
              stroke="#ffffff"
              stroke-width="1.3"
              stroke-linecap="round"
              opacity="0.8"
            />
            <circle cx="0" cy="-2" r="1.2" fill="#67e8f9" opacity="0.9" />
          </g>
        </g>

        <!-- Insignias Flotantes de Puntuación (Pill Badges con Relieve y Borde Neón) -->
        @for (fb of floatingBadges; track fb.id) {
          <g [attr.transform]="'translate(' + fb.x + ', ' + fb.y + ')'" [attr.opacity]="fb.alpha">
            <rect
              x="-22"
              y="-11"
              width="44"
              height="20"
              rx="10"
              fill="#0f172af0"
              [attr.stroke]="fb.borderColor"
              stroke-width="1.4"
            />
            <text
              x="0"
              y="3.5"
              text-anchor="middle"
              font-size="11"
              font-weight="900"
              [attr.fill]="fb.color"
              font-family="system-ui, sans-serif"
            >
              {{ fb.text }}
            </text>
          </g>
        }
      </svg>
    </div>

    <!-- HUD Control flotante y Accesibilidad -->
    <app-game-hud
      gameTitle="Galaga Espacial"
      gameType="galaga"
      [score]="score()"
      [highScore]="highScore()"
      [lives]="lives()"
      [combo]="combo()"
      [isGameOver]="isGameOver()"
      [isArcadeFocus]="isArcadeFocus()"
      [isPaused]="isPaused()"
      (restart)="restartGame()"
      (toggleArcade)="toggleArcadeMode()"
      (togglePause)="togglePause()"
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
  readonly toggleArcadeFocus = output<void>();
  readonly closeArcade = output<void>();

  // Señales reactivas
  score = signal<number>(0);
  highScore = signal<number>(0);
  lives = signal<number>(3);
  combo = signal<number>(0);
  isGameOver = signal<boolean>(false);
  isPaused = signal<boolean>(false);

  viewWidth = signal<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  viewHeight = signal<number>(typeof window !== 'undefined' ? window.innerHeight : 800);

  // Estado del caza y dinámicas de vuelo
  shipX = 400;
  shipY = 600;
  targetShipX = 400;
  targetShipY = 600;
  shipBankAngle = 0;
  muzzleFlashTimer = 0;
  thrusterScale = 1;
  shieldRotation = 0;

  // Invulnerabilidad y animaciones reactivas
  invulnerableTimer = 0;
  invulnerableFlash = false;
  alienPincerFlex = 0;
  alienCoreRadius = 4.5;

  // Colecciones de entidades
  lasers: Laser[] = [];
  enemies: Enemy[] = [];
  explosions: Explosion[] = [];
  floatingBadges: FloatingBadge[] = [];
  stars: Star[] = [];
  ionParticles: IonParticle[] = [];
  rockDebrisList: RockDebris[] = [];
  shootingStar: ShootingStar | null = null;

  private nextLaserId = 1;
  private nextEnemyId = 1;
  private nextExpId = 1;
  private nextBadgeId = 1;
  private nextIonId = 1;
  private nextDebrisId = 1;

  private fireTimer = 0;
  private spawnTimer = 0;
  private shootingStarTimer = 0;
  private ionEmitTimer = 0;
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
    this.shipY = this.viewHeight() - 95;
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

    if ((event.key === 'p' || event.key === 'P') && !this.isGameOver()) {
      this.togglePause();
      return;
    }

    // Acción Espacio: Salva Manual Rápida de Láseres en modo Arcade
    if (event.code === 'Space' && this.isArcadeFocus() && !this.isGameOver() && !this.isPaused()) {
      event.preventDefault();
      this.fireLasers();
      return;
    }

    if (this.isArcadeFocus() && !this.isGameOver() && !this.isPaused()) {
      const step = 45;
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        this.targetShipX = Math.max(45, this.targetShipX - step);
      } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        this.targetShipX = Math.min(this.viewWidth() - 45, this.targetShipX + step);
      } else if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
        const minY = this.viewHeight() * 0.52;
        this.targetShipY = Math.max(minY, this.targetShipY - step);
      } else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
        this.targetShipY = Math.min(this.viewHeight() - 55, this.targetShipY + step);
      }
    }
  }

  togglePause(): void {
    this.isPaused.update((p) => !p);
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.isPaused() && !this.isGameOver()) {
      const w = this.viewWidth();
      const h = this.viewHeight();
      this.targetShipX = Math.max(45, Math.min(w - 45, event.clientX));
      const minY = h * 0.52;
      const maxY = h - 60;
      this.targetShipY = Math.max(minY, Math.min(maxY, event.clientY));
    }
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
    const w = this.viewWidth();
    const h = this.viewHeight();
    this.stars = [];

    // Capa 1: Estrellas profundas (faint, lentas)
    for (let i = 0; i < 22; i++) {
      this.stars.push({
        id: i,
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.8,
        layer: 1,
        speed: 18 + Math.random() * 14,
        opacity: 0.25 + Math.random() * 0.25,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    // Capa 2: Estrellas medias con tinte cian
    for (let i = 22; i < 38; i++) {
      this.stars.push({
        id: i,
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.3,
        layer: 2,
        speed: 38 + Math.random() * 22,
        opacity: 0.5 + Math.random() * 0.25,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    // Capa 3: Estrellas cercanas brillantes con centelleo activo
    for (let i = 38; i < 50; i++) {
      this.stars.push({
        id: i,
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.8,
        layer: 3,
        speed: 70 + Math.random() * 40,
        opacity: 0.75 + Math.random() * 0.25,
        twinklePhase: Math.random() * Math.PI * 2,
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
    this.combo.set(0);
    this.isGameOver.set(false);
    this.isPaused.set(false);
    this.lasers = [];
    this.enemies = [];
    this.explosions = [];
    this.floatingBadges = [];
    this.ionParticles = [];
    this.rockDebrisList = [];
    this.invulnerableTimer = 0;
    this.cdr.detectChanges();
  }

  toggleArcadeMode(): void {
    this.toggleArcadeFocus.emit();
  }

  private startGameLoop(): void {
    this.ngZone.runOutsideAngular(() => {
      this.lastTime = performance.now();
      const loop = (currentTime: number) => {
        if (this.isDestroyed) return;
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        this.lastTime = currentTime;

        if (!this.isGameOver() && !this.isPaused()) {
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

    // 1. Movimiento suave del Caza Interceptor
    const dx = this.targetShipX - this.shipX;
    const dy = this.targetShipY - this.shipY;
    this.shipX += dx * Math.min(1, dt * 14);
    this.shipY += dy * Math.min(1, dt * 14);

    // Inclinación dinámica de alabeo en respuesta al desplazamiento lateral
    const targetBank = Math.max(-16, Math.min(16, dx * 0.42));
    this.shipBankAngle += (targetBank - this.shipBankAngle) * Math.min(1, dt * 12);

    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
    }

    this.thrusterScale = 0.9 + Math.random() * 0.45;
    this.shieldRotation = (this.shieldRotation + dt * 50) % 360;

    // Animación biológica de los alienígenas
    this.alienPincerFlex = Math.sin(this.gameTime * 5) * 2;
    this.alienCoreRadius = 4.2 + Math.sin(this.gameTime * 6.5) * 1.2;

    // Invulnerabilidad
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.invulnerableFlash = Math.floor(this.invulnerableTimer * 10) % 2 === 0;
    }

    // Emisión de partículas de escape iónico del motor
    this.ionEmitTimer += dt;
    if (this.ionEmitTimer >= 0.04) {
      this.ionEmitTimer = 0;
      this.emitIonParticles();
    }

    for (let i = this.ionParticles.length - 1; i >= 0; i--) {
      const ion = this.ionParticles[i];
      ion.y += ion.vy * dt;
      ion.alpha -= dt * 3.2;
      ion.size += dt * 4;
      if (ion.alpha <= 0) {
        this.ionParticles.splice(i, 1);
      }
    }

    // 2. Movimiento del Campo de Estrellas Parallax
    const h = this.viewHeight();
    const w = this.viewWidth();
    for (const star of this.stars) {
      star.y += star.speed * dt;
      star.twinklePhase += dt * 2.5;
      if (star.layer === 3) {
        star.opacity = 0.65 + Math.sin(star.twinklePhase) * 0.35;
      }
      if (star.y > h) {
        star.y = 0;
        star.x = Math.random() * w;
      }
    }

    // Evento de Estrella Fugaz
    this.shootingStarTimer += dt;
    if (this.shootingStarTimer >= 8 && !this.shootingStar) {
      this.shootingStarTimer = 0;
      this.spawnShootingStar();
    }

    if (this.shootingStar) {
      this.shootingStar.x += this.shootingStar.vx * dt;
      this.shootingStar.y += this.shootingStar.vy * dt;
      this.shootingStar.alpha -= dt * 1.5;
      if (this.shootingStar.alpha <= 0 || this.shootingStar.y > h) {
        this.shootingStar = null;
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
      if (laser.y < -30) {
        this.lasers.splice(i, 1);
      }
    }

    // 4. Spawner de Enemigos (máximo 4 concurrentes)
    this.spawnTimer += dt;
    const spawnInterval = Math.max(0.8, 1.5 - this.score() * 0.0018);
    if (this.spawnTimer >= spawnInterval && this.enemies.length < 4) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // 5. Movimiento y Colisiones
    const shipHitboxRadius = 22;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.y += enemy.vy * dt;
      enemy.rotation += enemy.vRot * dt;

      if (enemy.type === 'galaga') {
        const sway = Math.sin(this.gameTime * 2.8 + enemy.phase);
        enemy.x = enemy.initialX + sway * 68;
        // Inclinación aerodinámica de alabeo (banking motion)
        enemy.bankAngle = Math.cos(this.gameTime * 2.8 + enemy.phase) * 16;
      }

      // Colisión de Láseres
      for (let l = this.lasers.length - 1; l >= 0; l--) {
        const laser = this.lasers[l];
        const distSq = (laser.x - enemy.x) ** 2 + (laser.y - enemy.y) ** 2;
        if (distSq < (enemy.size + 6) ** 2) {
          this.lasers.splice(l, 1);
          enemy.hp--;

          if (enemy.hp <= 0) {
            this.destroyEnemy(enemy, i);
            break;
          } else {
            // Impacto parcial con chispa
            this.spawnExplosion(laser.x, laser.y, '#38bdf8', 12, 0.6);
          }
        }
      }

      // Colisión con el Caza del Jugador
      if (this.enemies[i]) {
        const playerDistSq = (this.shipX - enemy.x) ** 2 + (this.shipY - enemy.y) ** 2;
        if (playerDistSq < (shipHitboxRadius + enemy.size) ** 2) {
          if (this.invulnerableTimer <= 0) {
            this.hitPlayer();
          }
          this.destroyEnemy(enemy, i, false);
          continue;
        }

        if (enemy.y > h + 35) {
          this.enemies.splice(i, 1);
        }
      }
    }

    // 6. Actualización de fragmentos de roca (Debris)
    for (let i = this.rockDebrisList.length - 1; i >= 0; i--) {
      const debris = this.rockDebrisList[i];
      debris.x += debris.vx * dt;
      debris.y += debris.vy * dt;
      debris.rotation += debris.vRot * dt;
      debris.alpha -= dt * 1.8;
      if (debris.alpha <= 0) {
        this.rockDebrisList.splice(i, 1);
      }
    }

    // 7. Actualización de Explosiones Multietapa
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.radius += (exp.maxRadius - exp.radius) * Math.min(1, dt * 15);
      exp.alpha -= dt * 2.6;
      if (exp.alpha <= 0) {
        this.explosions.splice(i, 1);
      }
    }

    // 8. Actualización de Insignias Flotantes
    for (let i = this.floatingBadges.length - 1; i >= 0; i--) {
      const fb = this.floatingBadges[i];
      fb.y -= 36 * dt;
      fb.alpha -= dt * 1.6;
      if (fb.alpha <= 0) {
        this.floatingBadges.splice(i, 1);
      }
    }
  }

  fireLasers(): void {
    this.muzzleFlashTimer = 0.08;
    // Cañones dobles situados en los pylones alares
    this.lasers.push({
      id: this.nextLaserId++,
      x: this.shipX - 23,
      y: this.shipY - 2,
      vy: -780,
    });
    this.lasers.push({
      id: this.nextLaserId++,
      x: this.shipX + 23,
      y: this.shipY - 2,
      vy: -780,
    });
  }

  private emitIonParticles(): void {
    const leftNozzleX = this.shipX - 6.5;
    const rightNozzleX = this.shipX + 6.5;
    const nozzleY = this.shipY + 16;

    this.ionParticles.push({
      id: this.nextIonId++,
      x: leftNozzleX + (Math.random() - 0.5) * 2,
      y: nozzleY,
      vy: 80 + Math.random() * 40,
      alpha: 0.8,
      size: 2.5,
    });

    this.ionParticles.push({
      id: this.nextIonId++,
      x: rightNozzleX + (Math.random() - 0.5) * 2,
      y: nozzleY,
      vy: 80 + Math.random() * 40,
      alpha: 0.8,
      size: 2.5,
    });

    if (this.ionParticles.length > 24) {
      this.ionParticles.splice(0, this.ionParticles.length - 24);
    }
  }

  private spawnShootingStar(): void {
    const w = this.viewWidth();
    this.shootingStar = {
      x: Math.random() * (w * 0.7),
      y: -10,
      vx: 450 + Math.random() * 200,
      vy: 350 + Math.random() * 150,
      length: 120,
      alpha: 0.9,
    };
  }

  private spawnEnemy(): void {
    const w = this.viewWidth();
    const x = Math.random() * (w - 140) + 70;
    const isAlien = Math.random() > 0.42;

    if (isAlien) {
      this.enemies.push({
        id: this.nextEnemyId++,
        type: 'galaga',
        x,
        y: -35,
        initialX: x,
        vy: 165 + Math.random() * 40,
        hp: 2,
        maxHp: 2,
        rotation: 0,
        vRot: 0,
        size: 20,
        phase: Math.random() * Math.PI * 2,
        points: 30,
        bankAngle: 0,
      });
    } else {
      this.enemies.push({
        id: this.nextEnemyId++,
        type: 'asteroid',
        x,
        y: -35,
        initialX: x,
        vy: 145 + Math.random() * 70,
        hp: 1,
        maxHp: 1,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 80,
        size: 19,
        phase: 0,
        points: 15,
        bankAngle: 0,
      });
    }
  }

  private destroyEnemy(enemy: Enemy, index: number, awardPoints = true): void {
    if (awardPoints) {
      const curCombo = this.combo() + 1;
      this.combo.set(curCombo);
      const mult = curCombo >= 12 ? 4 : curCombo >= 8 ? 3 : curCombo >= 4 ? 2 : 1;
      const earnedPoints = enemy.points * mult;
      const newScore = this.score() + earnedPoints;
      this.score.set(newScore);

      if (newScore > this.highScore()) {
        this.highScore.set(newScore);
        this.saveHighScore(newScore);
      }

      this.sound.playSuccess();

      // Insignia flotante pill con relieve
      this.floatingBadges.push({
        id: this.nextBadgeId++,
        text: mult > 1 ? `+${earnedPoints} (x${mult})` : `+${earnedPoints}`,
        x: enemy.x,
        y: enemy.y - 14,
        color: enemy.type === 'galaga' ? '#fb7185' : '#38bdf8',
        borderColor: enemy.type === 'galaga' ? '#f43f5e' : '#0284c7',
        alpha: 1,
      });

      if (this.floatingBadges.length > 4) {
        this.floatingBadges.shift();
      }
    }

    // Ondas de choque multietapa
    this.spawnExplosion(
      enemy.x,
      enemy.y,
      enemy.type === 'galaga' ? '#fb7185' : '#94a3b8',
      enemy.size * 2.0,
      1
    );

    // Si era un asteroide, despedir esquirlas de roca poligonales
    if (enemy.type === 'asteroid') {
      this.spawnRockDebris(enemy.x, enemy.y, 6);
    }

    this.enemies.splice(index, 1);
  }

  private hitPlayer(): void {
    this.combo.set(0);
    this.invulnerableTimer = 1.5;
    const currentLives = this.lives() - 1;
    this.lives.set(currentLives);

    this.sound.playAlert();

    // Insignia flotante de daño
    this.floatingBadges.push({
      id: this.nextBadgeId++,
      text: '-1 HP',
      x: this.shipX,
      y: this.shipY - 24,
      color: '#f87171',
      borderColor: '#ef4444',
      alpha: 1,
    });

    if (this.floatingBadges.length > 4) {
      this.floatingBadges.shift();
    }

    this.spawnExplosion(this.shipX, this.shipY, '#ef4444', 44, 1);

    if (currentLives <= 0) {
      this.isGameOver.set(true);
    }
  }

  private spawnExplosion(x: number, y: number, color: string, maxRadius: number, alpha: number): void {
    this.explosions.push({
      id: this.nextExpId++,
      x,
      y,
      radius: 5,
      maxRadius,
      alpha,
      color,
      stage: 1,
    });

    if (this.explosions.length > 10) {
      this.explosions.shift();
    }
  }

  private spawnRockDebris(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 90;
      this.rockDebrisList.push({
        id: this.nextDebrisId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 180,
        size: 3 + Math.random() * 3.5,
        alpha: 1,
        color: Math.random() > 0.5 ? '#64748b' : '#475569',
      });
    }

    if (this.rockDebrisList.length > 18) {
      this.rockDebrisList.splice(0, this.rockDebrisList.length - 18);
    }
  }
}
