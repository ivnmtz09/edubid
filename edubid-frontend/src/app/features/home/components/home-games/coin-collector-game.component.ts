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

interface FloatingBadge {
  id: number;
  text: string;
  type: 'coin' | 'super' | 'bomb';
  x: number;
  y: number;
  color: string;
  borderColor: string;
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
  shape: 'circle' | 'star' | 'ring';
}

interface GroundRipple {
  id: number;
  x: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

@Component({
  selector: 'app-coin-collector-game',
  standalone: true,
  imports: [CommonModule, GameHudComponent],
  host: {
    class: 'block w-full h-full',
  },
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
          <!-- 1. Moneda EduCoin: Gradiente 3D con relieve metálico oro pulido -->
          <linearGradient id="coinBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="35%" stop-color="#facc15" />
            <stop offset="70%" stop-color="#ca8a04" />
            <stop offset="100%" stop-color="#854d0e" />
          </linearGradient>

          <linearGradient id="coinFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fef9c3" />
            <stop offset="45%" stop-color="#eab308" />
            <stop offset="100%" stop-color="#a16207" />
          </linearGradient>

          <!-- 2. Super Moneda Holográfica EduBid: Gradiente vibrante ultra estilizado -->
          <linearGradient id="superCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#67e8f9" />
            <stop offset="30%" stop-color="#ec4899" />
            <stop offset="70%" stop-color="#a855f7" />
            <stop offset="100%" stop-color="#3b82f6" />
          </linearGradient>

          <linearGradient id="superAuraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f472b6" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>

          <!-- 3. Carreta: Madera rica en vetas, molduras doradas y remaches -->
          <linearGradient id="cartWoodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#92400e" />
            <stop offset="25%" stop-color="#78350f" />
            <stop offset="55%" stop-color="#542407" />
            <stop offset="85%" stop-color="#78350f" />
            <stop offset="100%" stop-color="#451a03" />
          </linearGradient>

          <linearGradient id="cartGoldTrim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#d97706" />
            <stop offset="30%" stop-color="#fef08a" />
            <stop offset="70%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>

          <linearGradient id="wheelRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="50%" stop-color="#b45309" />
            <stop offset="100%" stop-color="#451a03" />
          </linearGradient>

          <!-- 4. Bomba: Esfera de obsidiana brillante con hotspot de iluminación -->
          <radialGradient id="bombObsidianGrad" cx="34%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#94a3b8" />
            <stop offset="18%" stop-color="#475569" />
            <stop offset="55%" stop-color="#1e293b" />
            <stop offset="85%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#020617" />
          </radialGradient>

          <linearGradient id="fuseSparksGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="50%" stop-color="#f97316" />
            <stop offset="100%" stop-color="#dc2626" />
          </linearGradient>

          <!-- 5. Personaje Aventurero EduBid: Bufanda con gradiente de movimiento -->
          <linearGradient id="scarfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f97316" />
            <stop offset="60%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#fbbf24" />
          </linearGradient>

          <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#334155" />
            <stop offset="50%" stop-color="#1e293b" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>

          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffedd5" />
            <stop offset="100%" stop-color="#fed7aa" />
          </linearGradient>
        </defs>

        <!-- Suelo con Cuadrícula de Perspectiva Moderna -->
        <g [attr.transform]="'translate(0, ' + groundY() + ')'">
          <!-- Líneas de cuadrícula en perspectiva hacia el horizonte -->
          @for (xOff of gridLinesX; track xOff) {
            <line
              [attr.x1]="xOff"
              y1="0"
              [attr.x2]="xOff + (xOff - (viewWidth() / 2)) * 0.4"
              y2="100"
              stroke="currentColor"
              class="text-amber-500/15 dark:text-amber-400/15"
              stroke-width="1.2"
            />
          }

          <!-- Líneas de profundidad horizontales con espaciado en perspectiva -->
          <line x1="0" y1="0" [attr.x2]="viewWidth()" y2="0" stroke="currentColor" class="text-amber-500/50 dark:text-amber-400/40" stroke-width="2.5" />
          <line x1="0" y1="12" [attr.x2]="viewWidth()" y2="12" stroke="currentColor" class="text-amber-500/25 dark:text-amber-400/20" stroke-width="1.8" />
          <line x1="0" y1="32" [attr.x2]="viewWidth()" y2="32" stroke="currentColor" class="text-amber-500/15 dark:text-amber-400/12" stroke-width="1.5" />
          <line x1="0" y1="62" [attr.x2]="viewWidth()" y2="62" stroke="currentColor" class="text-amber-500/10 dark:text-amber-400/8" stroke-width="1.2" />

          <!-- Relleno de fondo bajo el suelo -->
          <rect
            x="0"
            y="0"
            [attr.width]="viewWidth()"
            height="140"
            fill="currentColor"
            class="text-amber-500/5 dark:text-amber-400/5"
          />
        </g>

        <!-- Ondas de Impacto Dinámicas en el Suelo (Ripples) -->
        @for (r of groundRipples; track r.id) {
          <ellipse
            [attr.cx]="r.x"
            [attr.cy]="groundY() + 1"
            [attr.rx]="r.radius"
            [attr.ry]="r.radius * 0.28"
            fill="none"
            [attr.stroke]="r.color"
            stroke-width="1.8"
            [attr.opacity]="r.alpha"
          />
        }

        <!-- Partículas de Recolección y Explosión Multi-color -->
        @for (p of particles; track p.id) {
          @if (p.shape === 'star') {
            <polygon
              [attr.points]="getStarPoints(p.x, p.y, p.size)"
              [attr.fill]="p.color"
              [attr.opacity]="p.alpha"
            />
          } @else if (p.shape === 'ring') {
            <circle
              [attr.cx]="p.x"
              [attr.cy]="p.y"
              [attr.r]="p.size"
              fill="none"
              [attr.stroke]="p.color"
              stroke-width="1.5"
              [attr.opacity]="p.alpha"
            />
          } @else {
            <circle
              [attr.cx]="p.x"
              [attr.cy]="p.y"
              [attr.r]="p.size"
              [attr.fill]="p.color"
              [attr.opacity]="p.alpha"
            />
          }
        }

        <!-- Objetos que caen del cielo (Monedas 3D, Super Monedas y Bombas de Obsidiana) -->
        @for (item of items; track item.id) {
          <g [attr.transform]="'translate(' + item.x + ', ' + item.y + ') rotate(' + item.rotation + ')'">
            @if (item.type === 'coin') {
              <!-- Moneda EduCoin 3D con Borde Moleteado y Glifo Euro Relieve -->
              <g [attr.transform]="'scale(' + item.scaleX + ', 1)'">
                <!-- Borde exterior moleteado -->
                <circle cx="0" cy="0" [attr.r]="item.size" fill="url(#coinBevelGrad)" stroke="#78350f" stroke-width="1.2" />
                <circle cx="0" cy="0" [attr.r]="item.size - 1.2" fill="none" stroke="#fef08a" stroke-width="1" stroke-dasharray="2 1.5" />
                
                <!-- Cara interior rehundida -->
                <circle cx="0" cy="0" [attr.r]="item.size * 0.76" fill="url(#coinFaceGrad)" stroke="#ca8a04" stroke-width="0.8" />
                
                <!-- Glifo EduCoin 'E' en 3D (sombra inferior y relieve luminoso) -->
                <text
                  x="0.6"
                  y="4.2"
                  text-anchor="middle"
                  font-size="12"
                  font-weight="900"
                  fill="#78350f"
                  font-family="system-ui, sans-serif"
                >
                  E
                </text>
                <text
                  x="0"
                  y="3.6"
                  text-anchor="middle"
                  font-size="12"
                  font-weight="900"
                  fill="#fffbeb"
                  font-family="system-ui, sans-serif"
                >
                  E
                </text>

                <!-- Brillo especular dinámico -->
                <path
                  d="M -7 -7 A 9 9 0 0 1 7 -7 A 7 7 0 0 0 -7 -7 Z"
                  fill="#ffffff"
                  opacity="0.45"
                />
              </g>
            } @else if (item.type === 'super') {
              <!-- Super Moneda Holográfica con Estrella Reluciente Giratoria -->
              <g [attr.transform]="'scale(' + item.scaleX + ', 1)'">
                <!-- Halo holográfico exterior -->
                <circle cx="0" cy="0" [attr.r]="item.size + 3" fill="none" stroke="url(#superAuraGrad)" stroke-width="1.5" stroke-dasharray="6 3" opacity="0.85" />
                
                <!-- Cuerpo con gradiente prismático -->
                <circle cx="0" cy="0" [attr.r]="item.size" fill="url(#superCoinGrad)" stroke="#ffffff" stroke-width="1.5" />
                <circle cx="0" cy="0" [attr.r]="item.size * 0.8" fill="none" stroke="#fdf4ff" stroke-width="0.8" />

                <!-- Estrella brillante central de 8 puntas -->
                <g [attr.transform]="'rotate(' + (item.rotation * 1.5) + ')'">
                  <polygon
                    points="0,-9 2.5,-3 9,0 2.5,3 0,9 -2.5,3 -9,0 -2.5,-3"
                    fill="#ffffff"
                  />
                  <polygon
                    points="0,-6 2,-2 6,0 2,2 0,6 -2,2 -6,0 -2,-2"
                    fill="#fef08a"
                  />
                </g>
              </g>
            } @else {
              <!-- Bomba de Obsidiana Metálica con Mecha Reactiva y Chispas -->
              <g>
                <!-- Mecha curva reactiva -->
                <path
                  d="M 0 -13 C 3 -21, 9 -20, 11 -27"
                  fill="none"
                  stroke="#78350f"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />

                <!-- Chispas parpadeantes en la punta de la mecha -->
                <circle [attr.cx]="11 + sparkOffX1" [attr.cy]="-27 + sparkOffY1" r="3.2" fill="#ef4444" opacity="0.9" />
                <circle [attr.cx]="11 + sparkOffX2" [attr.cy]="-27 + sparkOffY2" r="2.2" fill="#f97316" />
                <circle cx="11" cy="-27" r="1.3" fill="#fef08a" />

                <!-- Cuerpo de obsidiana con brillo especular 3D -->
                <circle cx="0" cy="0" [attr.r]="item.size" fill="url(#bombObsidianGrad)" stroke="#090d16" stroke-width="1.8" />
                
                <!-- Reflejo curvo brillante -->
                <path
                  d="M -7 -8 A 10 10 0 0 1 4 -12 A 12 12 0 0 0 -7 -8 Z"
                  fill="#ffffff"
                  opacity="0.4"
                />

                <!-- Símbolo de Advertencia / Peligro Neón Carmesí -->
                <g transform="translate(0, 1) scale(0.9)">
                  <!-- Triángulo de peligro neón -->
                  <polygon
                    points="0,-7 6,4 -6,4"
                    fill="none"
                    stroke="#ef4444"
                    stroke-width="1.6"
                    stroke-linejoin="round"
                  />
                  <!-- Signo de exclamación neón -->
                  <line x1="0" y1="-3.5" x2="0" y2="0.5" stroke="#ef4444" stroke-width="1.6" stroke-linecap="round" />
                  <circle cx="0" cy="2.5" r="0.8" fill="#ef4444" />
                </g>
              </g>
            }
          </g>
        }

        <!-- Personaje Aventurero EduBid con Carreta de Lujo -->
        <g [attr.transform]="'translate(' + playerX + ', ' + groundY() + ') scale(' + facingDirection + ', 1)'">
          <!-- Sombra dinámica sobre el suelo -->
          <ellipse cx="14" cy="0" rx="44" ry="6" fill="#000000" opacity="0.25" />

          <!-- Grupo con efecto parpadeo de invulnerabilidad -->
          <g [attr.opacity]="invulnerableTimer > 0 ? (invulnerableFlash ? 0.35 : 1) : 1">
            <!-- ============================================== -->
            <!-- CARRETA DE MADERA NOBLE Y EMBELLECEDORES ORO   -->
            <!-- ============================================== -->
            <g id="cart">
              <!-- Sombra interior de la caja -->
              <polygon points="14,-28 54,-28 47,-6 17,-6" fill="#3d1a04" opacity="0.4" />

              <!-- Monedas de oro visibles acumuladas dentro de la carreta -->
              @if (score() > 0) {
                <g id="cart-coins">
                  <circle cx="26" cy="-22" r="5" fill="url(#coinFaceGrad)" stroke="#b45309" stroke-width="0.8" />
                  <circle cx="34" cy="-25" r="5.5" fill="url(#coinBevelGrad)" stroke="#b45309" stroke-width="0.8" />
                  <circle cx="42" cy="-21" r="5" fill="url(#coinFaceGrad)" stroke="#b45309" stroke-width="0.8" />
                  @if (score() > 50) {
                    <circle cx="30" cy="-28" r="4.8" fill="url(#coinBevelGrad)" stroke="#b45309" stroke-width="0.8" />
                    <circle cx="38" cy="-27" r="5.2" fill="url(#coinFaceGrad)" stroke="#b45309" stroke-width="0.8" />
                  }
                  <!-- Destello sutil de brillo en las monedas recolectadas -->
                  @if (coinGlintVisible) {
                    <polygon
                      [attr.points]="getStarPoints(34, -28, 3.5)"
                      fill="#ffffff"
                      opacity="0.9"
                    />
                  }
                </g>
              }

              <!-- Cuerpo principal de madera con tablones -->
              <path
                d="M 14 -28 L 54 -28 L 47 -6 L 17 -6 Z"
                fill="url(#cartWoodGrad)"
                stroke="#542407"
                stroke-width="1.5"
              />

              <!-- Separadores de tablones de madera tallada -->
              <line x1="15" y1="-20" x2="52" y2="-20" stroke="#3d1a04" stroke-width="1" />
              <line x1="16" y1="-13" x2="49" y2="-13" stroke="#3d1a04" stroke-width="1" />
              <line x1="28" y1="-28" x2="27" y2="-6" stroke="#542407" stroke-width="1.2" />
              <line x1="40" y1="-28" x2="39" y2="-6" stroke="#542407" stroke-width="1.2" />

              <!-- Moldura superior pulida en oro de EduBid -->
              <path
                d="M 12 -28 L 56 -28"
                stroke="url(#cartGoldTrim)"
                stroke-width="3.2"
                stroke-linecap="round"
              />

              <!-- Remaches metálicos dorados en las esquinas -->
              <circle cx="16" cy="-25" r="1.5" fill="#fef08a" stroke="#78350f" stroke-width="0.5" />
              <circle cx="52" cy="-25" r="1.5" fill="#fef08a" stroke="#78350f" stroke-width="0.5" />
              <circle cx="19" cy="-9" r="1.5" fill="#fef08a" stroke="#78350f" stroke-width="0.5" />
              <circle cx="45" cy="-9" r="1.5" fill="#fef08a" stroke="#78350f" stroke-width="0.5" />

              <!-- Asa de tracción reforzada de latón -->
              <path
                d="M 6 -24 L 15 -25"
                stroke="url(#cartGoldTrim)"
                stroke-width="3"
                stroke-linecap="round"
              />
              <circle cx="6" cy="-24" r="2.2" fill="#78350f" stroke="#fef08a" stroke-width="0.8" />

              <!-- Rueda delantera detallada con radios y llanta sombreada -->
              <g [attr.transform]="'translate(24, -5) rotate(' + wheelRotation + ')'">
                <!-- Neumático / Banda de acero exterior -->
                <circle cx="0" cy="0" r="7.5" fill="#1e293b" stroke="#0f172a" stroke-width="1" />
                <!-- Llanta de latón dorada biselada -->
                <circle cx="0" cy="0" r="6" fill="#451a03" stroke="url(#wheelRimGrad)" stroke-width="1.5" />
                <!-- 6 Radios aerodinámicos -->
                <line x1="-5.5" y1="0" x2="5.5" y2="0" stroke="#f59e0b" stroke-width="1.1" />
                <line x1="-2.7" y1="-4.8" x2="2.7" y2="4.8" stroke="#f59e0b" stroke-width="1.1" />
                <line x1="-2.7" y1="4.8" x2="2.7" y2="-4.8" stroke="#f59e0b" stroke-width="1.1" />
                <!-- Cubo central con perno dorado -->
                <circle cx="0" cy="0" r="2.6" fill="#facc15" stroke="#78350f" stroke-width="0.8" />
                <circle cx="0" cy="0" r="1" fill="#fffbeb" />
              </g>

              <!-- Rueda trasera detallada -->
              <g [attr.transform]="'translate(46, -5) rotate(' + wheelRotation + ')'">
                <circle cx="0" cy="0" r="7.5" fill="#1e293b" stroke="#0f172a" stroke-width="1" />
                <circle cx="0" cy="0" r="6" fill="#451a03" stroke="url(#wheelRimGrad)" stroke-width="1.5" />
                <line x1="-5.5" y1="0" x2="5.5" y2="0" stroke="#f59e0b" stroke-width="1.1" />
                <line x1="-2.7" y1="-4.8" x2="2.7" y2="4.8" stroke="#f59e0b" stroke-width="1.1" />
                <line x1="-2.7" y1="4.8" x2="2.7" y2="-4.8" stroke="#f59e0b" stroke-width="1.1" />
                <circle cx="0" cy="0" r="2.6" fill="#facc15" stroke="#78350f" stroke-width="0.8" />
                <circle cx="0" cy="0" r="1" fill="#fffbeb" />
              </g>
            </g>

            <!-- ============================================== -->
            <!-- PERSONAJE AVENTURERO ESTUDIANTE EDUBID         -->
            <!-- ============================================== -->
            <g id="runner-character">
              <!-- Pierna Trasera Articulada (Muslo -> Rodilla -> Zapatilla) -->
              <g id="back-leg">
                <path
                  [attr.d]="'M -12 -23 Q ' + backKneeX + ' ' + backKneeY + ' ' + backFootX + ' ' + backFootY"
                  fill="none"
                  stroke="#1e293b"
                  class="dark:stroke-slate-300"
                  stroke-width="3.5"
                  stroke-linecap="round"
                />
                <!-- Zapatilla Deportiva Trasera -->
                <g [attr.transform]="'translate(' + backFootX + ', ' + backFootY + ')'">
                  <path d="M -3 -1 L 7 -1 C 9 -1 10 -3 9 -5 L 3 -5 L -2 -4 Z" fill="#0284c7" />
                  <rect x="-3" y="-2" width="12" height="2.5" rx="1" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.4" />
                </g>
              </g>

              <!-- Bufanda / Capa Deportiva Dinámica con Ondas de Viento -->
              <path
                [attr.d]="scarfPath"
                fill="url(#scarfGrad)"
                stroke="#d97706"
                stroke-width="0.8"
              />

              <!-- Torso y Chaqueta Urbana EduBid -->
              <path
                d="M -16 -40 L -6 -40 L -9 -23 L -15 -23 Z"
                fill="url(#jacketGrad)"
                stroke="#0f172a"
                stroke-width="1.2"
              />
              <!-- Cremallera frontal y acento naranja -->
              <line x1="-9" y1="-39" x2="-11" y2="-23" stroke="#f59e0b" stroke-width="1.5" />
              <circle cx="-13" cy="-35" r="1.5" fill="#f97316" />

              <!-- Brazo Articulado sujetando el asa -->
              <path
                d="M -8 -37 Q -1 -30 6 -24"
                fill="none"
                stroke="#1e293b"
                class="dark:stroke-slate-300"
                stroke-width="3"
                stroke-linecap="round"
              />
              <!-- Guante / Mano cerrada sobre el mango -->
              <circle cx="6" cy="-24" r="2.8" fill="#f59e0b" stroke="#78350f" stroke-width="0.8" />

              <!-- Pierna Delantera Articulada -->
              <g id="front-leg">
                <path
                  [attr.d]="'M -12 -23 Q ' + frontKneeX + ' ' + frontKneeY + ' ' + frontFootX + ' ' + frontFootY"
                  fill="none"
                  stroke="#334155"
                  class="dark:stroke-slate-200"
                  stroke-width="3.8"
                  stroke-linecap="round"
                />
                <!-- Zapatilla Deportiva Delantera -->
                <g [attr.transform]="'translate(' + frontFootX + ', ' + frontFootY + ')'">
                  <path d="M -3 -1 L 8 -1 C 10 -1 11 -3 10 -5 L 4 -5 L -2 -4 Z" fill="#f97316" />
                  <rect x="-3" y="-2" width="13" height="2.5" rx="1" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.4" />
                </g>
              </g>

              <!-- Cuello y Cabeza -->
              <rect x="-13" y="-44" width="4" height="4" fill="url(#skinGrad)" />

              <!-- Cabeza con Cabeza Estilizada y Tono de Piel -->
              <circle cx="-10" cy="-52" r="9.5" fill="url(#skinGrad)" stroke="#451a03" stroke-width="1" />

              <!-- Mechones de Pelo Anime / Modernos -->
              <path d="M -18 -55 Q -14 -60 -9 -59 Q -7 -54 -10 -51" fill="#1e293b" />
              <path d="M -18 -50 Q -17 -44 -14 -47" fill="#1e293b" />

              <!-- Gorra / Visera Deportiva EduBid con Logotipo -->
              <path
                d="M -18 -58 Q -10 -64 -2 -60 L 5 -58 L -1 -54 Q -9 -56 -18 -54 Z"
                fill="#0f172a"
                stroke="#f97316"
                stroke-width="1"
              />
              <!-- Visera naranja aerodinámica -->
              <path d="M -2 -60 L 7 -58 L 0 -54 Z" fill="#f97316" stroke="#ea580c" stroke-width="0.8" />

              <!-- Expresión Facial Reactiva (Ojos y Boca dinámicos) -->
              @if (invulnerableTimer > 0) {
                <!-- Ojo herido / sorprendido (> <) -->
                <path d="M -8 -54 L -5 -52 L -8 -50" fill="none" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <!-- Boca de sobresalto -->
                <circle cx="-5" cy="-46" r="1.8" fill="#0f172a" />
              } @else if (coinReactionTimer > 0) {
                <!-- Ojo alegre / guiño brillante -->
                <path d="M -8 -52 Q -5 -56 -2 -52" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" />
                <!-- Boca alegre abierta -->
                <path d="M -7 -47 Q -4 -42 -1 -47 Z" fill="#ef4444" stroke="#0f172a" stroke-width="0.8" />
              } @else {
                <!-- Ojo determinado en carrera con brillo pupilar -->
                <ellipse cx="-5" cy="-52" rx="2.2" ry="3.2" fill="#0f172a" />
                <circle cx="-4.2" cy="-53" r="1" fill="#ffffff" />
                <path d="M -7 -56 L -3 -55" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round" />
                <!-- Sonrisa segura -->
                <path d="M -6 -47 Q -4 -45 -1 -47" fill="none" stroke="#0f172a" stroke-width="1.4" stroke-linecap="round" />
              }
            </g>
          </g>
        </g>

        <!-- Insignias Flotantes de Puntuación (Pill Badges con Borde Neón y Sombra) -->
        @for (fb of floatingBadges; track fb.id) {
          <g [attr.transform]="'translate(' + fb.x + ', ' + fb.y + ')'" [attr.opacity]="fb.alpha">
            <rect
              x="-24"
              y="-12"
              width="48"
              height="22"
              rx="11"
              fill="#0f172af0"
              [attr.stroke]="fb.borderColor"
              stroke-width="1.5"
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
      gameTitle="Recolector de Monedas"
      gameType="coins"
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
export class CoinCollectorGameComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('svgEl') svgElRef!: ElementRef<SVGSVGElement>;

  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private sound = inject(SoundService);

  readonly isArcadeFocus = input<boolean>(false);
  readonly toggleArcadeFocus = output<void>();
  readonly closeArcade = output<void>();

  // Señales de juego reactivas
  score = signal<number>(0);
  highScore = signal<number>(0);
  lives = signal<number>(3);
  combo = signal<number>(0);
  isGameOver = signal<boolean>(false);
  isPaused = signal<boolean>(false);

  viewWidth = signal<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  viewHeight = signal<number>(typeof window !== 'undefined' ? window.innerHeight : 800);
  groundY = signal<number>(typeof window !== 'undefined' ? window.innerHeight - 60 : 740);

  // Coordenadas y físicas del personaje corredor
  playerX = 300;
  targetPlayerX = 300;
  facingDirection = 1;
  wheelRotation = 0;
  runPhase = 0;
  currentSpeed = 0;

  // Articulación de piernas
  frontKneeX = -6;
  frontKneeY = -12;
  frontFootX = -4;
  frontFootY = -2;

  backKneeX = -18;
  backKneeY = -12;
  backFootX = -16;
  backFootY = -2;

  // Física de la bufanda ondeante
  scarfPath = 'M -16 -40 Q -26 -40 -34 -38 Q -24 -36 -14 -37 Z';

  // Chispas de la mecha de la bomba
  sparkOffX1 = 0;
  sparkOffY1 = 0;
  sparkOffX2 = 0;
  sparkOffY2 = 0;
  coinGlintVisible = false;

  // Temporizadores
  invulnerableTimer = 0;
  invulnerableFlash = false;
  coinReactionTimer = 0;

  // Cuadrícula perspectiva
  gridLinesX: number[] = [];

  // Colecciones de entidades del juego
  items: FallingItem[] = [];
  particles: Particle[] = [];
  floatingBadges: FloatingBadge[] = [];
  groundRipples: GroundRipple[] = [];

  private nextItemId = 1;
  private nextParticleId = 1;
  private nextBadgeId = 1;
  private nextRippleId = 1;
  private spawnTimer = 0;

  private animFrameId: number | null = null;
  private lastTime = 0;
  private isDestroyed = false;

  private boundOnPointerMove = this.onPointerMove.bind(this);
  private boundOnResize = this.onResize.bind(this);

  ngOnInit(): void {
    this.loadHighScore();
    this.calculateGridLines();
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

    if ((event.key === 'p' || event.key === 'P') && !this.isGameOver()) {
      this.togglePause();
      return;
    }

    // Acción Espacio: Dash / Impulso rápido del corredor en Arcade
    if (event.code === 'Space' && this.isArcadeFocus() && !this.isGameOver() && !this.isPaused()) {
      event.preventDefault();
      const dashDistance = 85 * this.facingDirection;
      this.targetPlayerX = Math.max(70, Math.min(this.viewWidth() - 70, this.targetPlayerX + dashDistance));
      this.spawnDustParticles(this.playerX, this.groundY(), 5);
      return;
    }

    if (this.isArcadeFocus() && !this.isGameOver() && !this.isPaused()) {
      const step = 50;
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        this.targetPlayerX = Math.max(70, this.targetPlayerX - step);
      } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        this.targetPlayerX = Math.min(this.viewWidth() - 70, this.targetPlayerX + step);
      }
    }
  }

  togglePause(): void {
    this.isPaused.update((p) => !p);
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.isPaused() && !this.isGameOver()) {
      this.targetPlayerX = Math.max(70, Math.min(this.viewWidth() - 90, event.clientX));
    }
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
    this.calculateGridLines();
  }

  private calculateGridLines(): void {
    const w = this.viewWidth();
    const count = 16;
    const step = w / count;
    this.gridLinesX = [];
    for (let i = 0; i <= count; i++) {
      this.gridLinesX.push(i * step);
    }
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
    this.highScore.set(this.highScore());
    this.lives.set(3);
    this.combo.set(0);
    this.isGameOver.set(false);
    this.isPaused.set(false);
    this.items = [];
    this.particles = [];
    this.floatingBadges = [];
    this.groundRipples = [];
    this.invulnerableTimer = 0;
    this.coinReactionTimer = 0;
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
    const now = performance.now() * 0.005;

    // 1. Movimiento suave del corredor aventurero con físicas de zancada
    const dx = this.targetPlayerX - this.playerX;
    this.currentSpeed = Math.abs(dx);
    const vx = dx * Math.min(1, dt * 13);
    this.playerX += vx;

    // Orientación hacia el objetivo
    if (vx > 1.2) {
      this.facingDirection = 1;
    } else if (vx < -1.2) {
      this.facingDirection = -1;
    }

    // Rotación de las ruedas y articulación de zancadas
    if (this.currentSpeed > 1) {
      this.wheelRotation = (this.wheelRotation + vx * 2.8) % 360;
      this.runPhase += this.currentSpeed * dt * 0.22;

      // Partículas sutiles de polvo bajo las ruedas a alta velocidad
      if (this.currentSpeed > 35 && Math.random() < 0.3) {
        this.spawnDust(
          this.playerX + (this.facingDirection === 1 ? 44 : 22),
          this.groundY() - 2
        );
      }
    }

    // Cinemática de piernas para ciclo de carrera
    const stride = Math.sin(this.runPhase);
    const cosStride = Math.cos(this.runPhase);

    this.frontKneeX = -10 + stride * 8;
    this.frontKneeY = -14 + Math.abs(cosStride) * 3;
    this.frontFootX = -10 + stride * 14;
    this.frontFootY = -2 - Math.max(0, cosStride * 7);

    this.backKneeX = -10 - stride * 8;
    this.backKneeY = -14 + Math.abs(cosStride) * 3;
    this.backFootX = -10 - stride * 14;
    this.backFootY = -2 - Math.max(0, -cosStride * 7);

    // Física ondeante de la bufanda / capa
    const scarfTrail = Math.min(this.currentSpeed * 0.35, 18);
    const wave1 = Math.sin(this.runPhase * 1.6) * 5;
    const wave2 = Math.cos(this.runPhase * 1.6) * 6;
    const tipX = -26 - scarfTrail + wave1;
    const tipY = -37 + wave2;
    this.scarfPath = `M -16 -40 Q -23 ${-41 + wave1 * 0.5} ${tipX} ${tipY} Q -22 ${-35 + wave2 * 0.5} -14 -37 Z`;

    // Chispas parpadeantes para la mecha de la bomba
    this.sparkOffX1 = (Math.random() - 0.5) * 4;
    this.sparkOffY1 = (Math.random() - 0.5) * 4;
    this.sparkOffX2 = (Math.random() - 0.5) * 3;
    this.sparkOffY2 = (Math.random() - 0.5) * 3;

    // Destello de monedas en la carreta
    this.coinGlintVisible = Math.sin(now * 3) > 0.6;

    // Temporizadores de estado
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.invulnerableFlash = Math.floor(this.invulnerableTimer * 12) % 2 === 0;
    }

    if (this.coinReactionTimer > 0) {
      this.coinReactionTimer -= dt;
    }

    // 2. Generación dinámica de objetos
    this.spawnTimer += dt;
    const spawnInterval = Math.max(0.7, 1.35 - this.score() * 0.0018);
    if (this.spawnTimer >= spawnInterval && this.items.length < 6) {
      this.spawnTimer = 0;
      this.spawnItem();
    }

    // 3. Actualización de objetos y colisiones
    const ground = this.groundY();
    const cartCenterX = this.playerX + this.facingDirection * 34;
    const cartCenterY = ground - 18;
    const cartHalfW = 26;
    const cartHalfH = 16;

    const manCenterX = this.playerX - this.facingDirection * 10;
    const manCenterY = ground - 34;
    const manHalfW = 16;
    const manHalfH = 32;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.y += item.vy * dt;
      item.rotation += item.vRot * dt;
      item.scaleX = Math.cos(now + item.id);

      // Colisión con la Carreta
      const hitCart =
        Math.abs(item.x - cartCenterX) < cartHalfW + item.size &&
        Math.abs(item.y - cartCenterY) < cartHalfH + item.size;

      // Colisión con el Personaje Aventurero
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

      // Caída al Suelo con Ondas (Ripples)
      if (item.y > ground + 4) {
        if (item.type === 'bomb') {
          this.spawnExplosion(item.x, ground, '#ef4444', 8);
          this.spawnRipple(item.x, '#f97316', 36);
        } else if (item.type === 'super') {
          this.spawnRipple(item.x, '#ec4899', 30);
        } else {
          this.spawnRipple(item.x, '#facc15', 24);
        }
        this.items.splice(i, 1);
      }
    }

    // 4. Actualización de partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
      p.alpha -= dt * 2.2;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 5. Actualización de ondas de suelo (Ripples)
    for (let i = this.groundRipples.length - 1; i >= 0; i--) {
      const r = this.groundRipples[i];
      r.radius += (r.maxRadius - r.radius) * Math.min(1, dt * 8);
      r.alpha -= dt * 2.0;
      if (r.alpha <= 0 || r.radius >= r.maxRadius - 1) {
        this.groundRipples.splice(i, 1);
      }
    }

    // 6. Actualización de insignias flotantes de puntaje
    for (let i = this.floatingBadges.length - 1; i >= 0; i--) {
      const fb = this.floatingBadges[i];
      fb.y -= 38 * dt;
      fb.alpha -= dt * 1.5;
      if (fb.alpha <= 0) {
        this.floatingBadges.splice(i, 1);
      }
    }
  }

  private spawnItem(): void {
    const w = this.viewWidth();
    const x = Math.random() * (w - 160) + 80;
    const rand = Math.random();

    let type: 'coin' | 'super' | 'bomb' = 'coin';
    let vy = 210 + Math.random() * 80;
    let size = 14;

    if (rand < 0.22) {
      type = 'bomb';
      vy = 240 + Math.random() * 80;
      size = 15;
    } else if (rand < 0.36) {
      type = 'super';
      vy = 270 + Math.random() * 70;
      size = 16;
    }

    this.items.push({
      id: this.nextItemId++,
      type,
      x,
      y: -24,
      vy,
      rotation: 0,
      vRot: (Math.random() - 0.5) * 80,
      size,
      scaleX: 1,
    });
  }

  private collectCoin(item: FallingItem, points: number): void {
    const curCombo = this.combo() + 1;
    this.combo.set(curCombo);
    const multiplier = curCombo >= 12 ? 4 : curCombo >= 8 ? 3 : curCombo >= 4 ? 2 : 1;
    const earnedPoints = points * multiplier;
    const newScore = this.score() + earnedPoints;
    this.score.set(newScore);

    if (newScore > this.highScore()) {
      this.highScore.set(newScore);
      this.saveHighScore(newScore);
    }

    this.coinReactionTimer = 0.5;
    this.sound.playSuccess();

    // Insignia pill flotante con relieve y glow
    const isSuper = points === 50;
    const badgeText = multiplier > 1 ? `+${earnedPoints} (x${multiplier})` : `+${earnedPoints}`;
    this.floatingBadges.push({
      id: this.nextBadgeId++,
      text: badgeText,
      type: isSuper ? 'super' : 'coin',
      x: item.x,
      y: item.y - 12,
      color: isSuper ? '#f472b6' : '#facc15',
      borderColor: isSuper ? '#ec4899' : '#eab308',
      alpha: 1,
    });

    if (this.floatingBadges.length > 4) {
      this.floatingBadges.shift();
    }

    // Explosión de chispas y estrellas
    this.spawnExplosion(
      item.x,
      item.y,
      isSuper ? '#ec4899' : '#facc15',
      isSuper ? 10 : 6,
      isSuper ? 'star' : 'circle'
    );

    this.spawnRipple(item.x, isSuper ? '#ec4899' : '#facc15', 28);
  }

  private hitBomb(item: FallingItem): void {
    this.combo.set(0);
    this.invulnerableTimer = 1.4;
    const currentLives = this.lives() - 1;
    this.lives.set(currentLives);

    this.sound.playAlert();

    // Insignia pill flotante de daño
    this.floatingBadges.push({
      id: this.nextBadgeId++,
      text: '-1 HP',
      type: 'bomb',
      x: item.x,
      y: item.y - 14,
      color: '#f87171',
      borderColor: '#ef4444',
      alpha: 1,
    });

    if (this.floatingBadges.length > 4) {
      this.floatingBadges.shift();
    }

    this.spawnExplosion(item.x, item.y, '#ef4444', 12, 'ring');
    this.spawnRipple(item.x, '#ef4444', 42);

    if (currentLives <= 0) {
      this.isGameOver.set(true);
    }
  }

  private spawnDustParticles(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        id: this.nextParticleId++,
        x,
        y: y - 2,
        vx: -this.facingDirection * (40 + Math.random() * 50),
        vy: -20 - Math.random() * 30,
        alpha: 0.8,
        color: '#fde047',
        size: 2.2 + Math.random() * 2,
        shape: 'circle',
      });
    }
  }

  private spawnExplosion(
    x: number,
    y: number,
    color: string,
    count: number,
    shape: 'circle' | 'star' | 'ring' = 'circle'
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 55 + Math.random() * 95;
      this.particles.push({
        id: this.nextParticleId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 35,
        alpha: 1,
        color,
        size: 2.5 + Math.random() * 2.5,
        shape,
      });
    }

    if (this.particles.length > 20) {
      this.particles.splice(0, this.particles.length - 20);
    }
  }

  private spawnRipple(x: number, color: string, maxRadius = 32): void {
    this.groundRipples.push({
      id: this.nextRippleId++,
      x,
      radius: 4,
      maxRadius,
      alpha: 0.9,
      color,
    });

    if (this.groundRipples.length > 8) {
      this.groundRipples.shift();
    }
  }

  private spawnDust(x: number, y: number): void {
    this.particles.push({
      id: this.nextParticleId++,
      x,
      y,
      vx: (Math.random() - 0.5) * 15 - (this.facingDirection * 18),
      vy: -8 - Math.random() * 16,
      alpha: 0.55,
      color: '#d97706',
      size: 2 + Math.random() * 2,
      shape: 'circle',
    });

    if (this.particles.length > 22) {
      this.particles.shift();
    }
  }

  getStarPoints(cx: number, cy: number, r: number): string {
    const points: string[] = [];
    for (let i = 0; i < 8; i++) {
      const radius = i % 2 === 0 ? r : r * 0.45;
      const angle = (i * Math.PI) / 4;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return points.join(' ');
  }
}
