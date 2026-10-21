import {
  Component,
  OnInit,
  signal,
  output,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SoundService } from '../../../../core/services/sound.service';

interface Riddle {
  id: string;
  category: string;
  badgeCode: string;
  question: string;
  hint: string;
  acceptedAnswers: string[];
  explanation: string;
}

@Component({
  selector: 'app-guardian-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="w-full max-w-xl mx-auto flex flex-col items-center justify-center min-h-[580px] p-4 text-center select-none font-sans">
      <!-- Gabinete Terminal del Guardián Arcade -->
      <div
        class="w-full rounded-3xl bg-neutral-950 border-2 border-neutral-800 p-6 sm:p-9 shadow-[0_0_50px_rgba(0,0,0,0.85)] relative overflow-hidden backdrop-blur-2xl transition-all duration-300"
        [class.border-emerald-500]="isSolved()"
        [class.shadow-[0_0_60px_rgba(16,185,129,0.25)]]="isSolved()"
        [class.border-rose-500]="hasError()"
      >
        <!-- Acentos de Iluminación Neón Arcade -->
        <div class="absolute -top-20 -left-20 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-20 -right-20 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Línea Scanline CRT interna sutil -->
        <div class="absolute inset-0 pointer-events-none opacity-[0.03] bg-[repeating-linear-gradient(0deg,#ffffff,#ffffff_1px,transparent_1px,transparent_3px)]"></div>

        <!-- Marquee Superior de la Terminal de Acceso -->
        <div class="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]"></span>
            <span class="font-mono text-[11px] font-black uppercase tracking-widest text-amber-400">
              SYS_GATE // BACHILLERATO COLOMBIA
            </span>
          </div>
          <div class="flex items-center gap-2 font-mono text-[10px] text-neutral-400">
            <span class="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 font-bold text-amber-300">
              {{ currentRiddle().badgeCode }}
            </span>
            <span class="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 font-bold text-emerald-400">
              FREE PLAY
            </span>
          </div>
        </div>

        <!-- Icono Central: Candado Criptográfico Arcade SVG -->
        <div
          class="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 mb-6 relative group shadow-inner"
          [class.bg-neutral-900]="!isSolved()"
          [class.border]="true"
          [class.border-neutral-800]="!isSolved()"
          [class.text-amber-400]="!isSolved()"
          [class.bg-emerald-500/15]="isSolved()"
          [class.border-emerald-500/40]="isSolved()"
          [class.text-emerald-400]="isSolved()"
          [class.scale-110]="isSolved()"
        >
          @if (!isSolved()) {
            <!-- Candado Arcade Vectorial -->
            <svg class="w-10 h-10 transition-transform group-hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          } @else {
            <!-- Llave Desbloqueada Vectorial -->
            <svg class="w-10 h-10 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          }
        </div>

        <!-- Estado No Resuelto: Formulario de la Prueba -->
        @if (!isSolved()) {
          <div class="space-y-1 mb-5">
            <h2 class="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white uppercase">
              Guardián del Saber
            </h2>
            <p class="text-xs font-mono text-neutral-400 max-w-md mx-auto">
              [DESAFÍO PEDAGÓGICO DE BACHILLERATO // INGRESA LA RESPUESTA]
            </p>
          </div>

          <!-- Pantalla CRT del Desafío -->
          <div class="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800 text-left mb-6 relative overflow-hidden shadow-inner">
            <!-- Esquinas retro arcade -->
            <div class="absolute top-2 left-2 text-[9px] font-mono text-neutral-600 select-none">┌</div>
            <div class="absolute top-2 right-2 text-[9px] font-mono text-neutral-600 select-none">┐</div>
            <div class="absolute bottom-2 left-2 text-[9px] font-mono text-neutral-600 select-none">└</div>
            <div class="absolute bottom-2 right-2 text-[9px] font-mono text-neutral-600 select-none">┘</div>

            <div class="flex items-center justify-between gap-2 mb-3">
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px] font-bold uppercase tracking-wider">
                <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>{{ currentRiddle().category }}</span>
              </div>

              <!-- Botón Cambiar Pregunta -->
              <button
                type="button"
                (click)="nextRiddle()"
                class="text-[11px] font-mono font-medium text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cambiar pregunta"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.038 8.038 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Otra Pregunta</span>
              </button>
            </div>

            <!-- Pregunta del Desafío -->
            <p class="text-sm sm:text-base font-semibold text-neutral-100 leading-snug my-3 font-sans">
              "{{ currentRiddle().question }}"
            </p>

            <!-- Sección de Pista con Icono SVG -->
            @if (showHint()) {
              <div class="mt-4 pt-3 border-t border-neutral-800 text-xs text-amber-300 font-mono flex items-start gap-2 animate-in fade-in">
                <svg class="w-4 h-4 shrink-0 mt-0.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span><strong class="font-bold">PISTA:</strong> {{ currentRiddle().hint }}</span>
              </div>
            } @else {
              <button
                type="button"
                (click)="showHint.set(true)"
                class="text-[11px] font-mono text-neutral-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer mt-2"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>[ Revelar Pista Pedagógica ]</span>
              </button>
            }
          </div>

          <!-- Formulario Terminal de Entrada -->
          <form (submit)="onSubmit($event)" class="space-y-4">
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-amber-400 font-bold text-sm pointer-events-none">></span>
              <input
                type="text"
                [(ngModel)]="userAnswer"
                name="userAnswer"
                (input)="clearError()"
                placeholder="Escribe tu respuesta..."
                autocomplete="off"
                class="w-full pl-8 pr-4 py-3.5 rounded-xl bg-neutral-900 border-2 border-neutral-800 text-white placeholder-neutral-500 font-mono text-sm focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all text-center tracking-wide"
              />
            </div>

            <!-- Error de Validación -->
            @if (errorMessage()) {
              <div class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs flex items-center justify-center gap-2 animate-in fade-in">
                <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <!-- Botones de Acción de Arcade -->
            <div class="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                class="w-full py-3.5 px-6 rounded-xl font-mono font-black text-xs uppercase tracking-wider bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 transition-all shadow-lg shadow-amber-500/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Verificar y Desbloquear</span>
              </button>

              <a
                routerLink="/"
                class="w-full sm:w-auto py-3.5 px-5 rounded-xl font-mono font-bold text-xs text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors text-center cursor-pointer"
              >
                Salir
              </a>
            </div>
          </form>
        } @else {
          <!-- Estado Triunfante / Acceso Concedido -->
          <div class="space-y-4 py-4 animate-in zoom-in-95 duration-300 font-mono">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-black tracking-widest uppercase">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>ACCESS GRANTED // 200 OK</span>
            </div>

            <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase font-sans">
              ¡Respuesta Correcta!
            </h2>
            <p class="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed font-sans">
              {{ currentRiddle().explanation }}
            </p>
            <p class="text-[11px] text-neutral-400">
              Iniciando sistema de minijuegos arcade...
            </p>
            <div class="w-full max-w-xs mx-auto h-2 rounded-full bg-neutral-800 overflow-hidden mt-4">
              <div class="h-full bg-emerald-400 animate-pulse w-full"></div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuardianQuizComponent implements OnInit {
  private sound = inject(SoundService);
  readonly unlocked = output<void>();

  userAnswer = '';
  showHint = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  isSolved = signal<boolean>(false);

  private readonly riddles: Riddle[] = [
    // 1. Matemáticas - Aritmética
    {
      id: 'math-power-zero',
      category: 'Matemáticas // Aritmética',
      badgeCode: 'BACH-MAT-01',
      question:
        '¿Cuál es el resultado numérico exacto de elevar cualquier número real distinto de cero a la potencia cero (x⁰)?',
      hint: 'Es el elemento neutro de la multiplicación y precede al número dos.',
      acceptedAnswers: ['1', 'uno', 'el uno', 'el 1'],
      explanation: 'Por definición de potenciación, x⁰ = 1 para cualquier número real x ≠ 0.',
    },
    // 2. Matemáticas - Álgebra
    {
      id: 'math-algebra-linear',
      category: 'Matemáticas // Álgebra Escolar',
      badgeCode: 'BACH-ALG-02',
      question:
        'En la ecuación lineal 2x + 8 = 24, ¿cuál es el valor exacto de la incógnita x?',
      hint: 'Resta 8 de 24 (obtendrás 16) y luego divide el resultado entre 2.',
      acceptedAnswers: ['8', 'ocho', 'el 8', 'x=8', 'x = 8'],
      explanation: 'Despejando: 2x = 16, por tanto x = 8.',
    },
    // 3. Geometría - Ángulos del triángulo
    {
      id: 'geom-triangle-angles',
      category: 'Geometría Euclidiana',
      badgeCode: 'BACH-GEO-03',
      question:
        '¿Cuántos grados sexagesimales suman en total los tres ángulos interiores de cualquier triángulo plano?',
      hint: 'Corresponde a la mitad de un giro completo (360°) o al valor de un ángulo llano.',
      acceptedAnswers: ['180', '180 grados', 'ciento ochenta', '180°', '180deg'],
      explanation: 'En geometría euclidiana, la suma de los ángulos internos de todo triángulo es siempre 180°.',
    },
    // 4. Geometría - Teorema de Pitágoras
    {
      id: 'geom-pythagoras-hypotenuse',
      category: 'Geometría & Trigonometría',
      badgeCode: 'BACH-GEO-04',
      question:
        'En un triángulo rectángulo, ¿cómo se denomina al lado de mayor longitud que se ubica opuesto al ángulo recto de 90°?',
      hint: 'Es la variable "c" en el célebre teorema de Pitágoras: a² + b² = c².',
      acceptedAnswers: ['hipotenusa', 'la hipotenusa'],
      explanation: 'La hipotenusa es el lado más largo y opuesto al ángulo recto en un triángulo rectángulo.',
    },
    // 5. Castellano & Literatura Colombiana - Nobel
    {
      id: 'lit-colombia-gabo',
      category: 'Castellano // Literatura Colombiana',
      badgeCode: 'BACH-CAS-05',
      question:
        '¿Qué escritor colombiano, nacido en Aracataca, recibió el Premio Nobel de Literatura en 1982 gracias a obras como "Cien años de soledad"?',
      hint: 'Conocido cariñosamente como "Gabo", máximo exponente del realismo mágico.',
      acceptedAnswers: [
        'gabriel garcia marquez',
        'garcia marquez',
        'gabo',
        'gabriel garcia',
      ],
      explanation: 'Gabriel García Márquez fue distinguido con el Premio Nobel de Literatura en 1982.',
    },
    // 6. Castellano & Gramática - Palabras agudas
    {
      id: 'grammar-words-agudas',
      category: 'Castellano // Gramática & Acentuación',
      badgeCode: 'BACH-CAS-06',
      question:
        '¿Cómo se clasifican las palabras que llevan el acento en la última sílaba (por ejemplo: "Bogotá", "educación", "reloj")?',
      hint: 'Se tildan cuando terminan en vocal, "n" o "s" (contrarias a las graves y esdrújulas).',
      acceptedAnswers: ['agudas', 'aguda', 'palabras agudas', 'palabra aguda'],
      explanation: 'Las palabras agudas llevan el acento prosódico u ortográfico en la última sílaba.',
    },
    // 7. Castellano - Figuras retóricas
    {
      id: 'lit-figures-hyperbole',
      category: 'Castellano // Figuras Literarias',
      badgeCode: 'BACH-CAS-07',
      question:
        '¿Qué figura literaria consiste en una exageración intencional y desmedida de la realidad (por ejemplo: "te busqué mil años")?',
      hint: 'Comienza con el prefijo griego "híper-" que denota exceso o demasía.',
      acceptedAnswers: ['hiperbole', 'la hiperbole'],
      explanation: 'La hipérbole es la figura retórica consistente en aumentar o disminuir de forma exagerada lo que se dice.',
    },
    // 8. Sociales & Historia de Colombia - Batalla de Boyacá
    {
      id: 'history-colombia-boyaca',
      category: 'Sociales // Historia de Colombia',
      badgeCode: 'BACH-SOC-08',
      question:
        '¿En qué histórica batalla del 7 de agosto de 1819 el ejército patriota de Simón Bolívar selló la independencia definitiva de la Nueva Granada?',
      hint: 'Ocurrió en un célebre puente sobre el río Teatinos, cerca de la ciudad de Tunja.',
      acceptedAnswers: ['boyaca', 'batalla de boyaca', 'puente de boyaca'],
      explanation: 'La Batalla de Boyacá del 7 de agosto de 1819 selló el triunfo patriota y la independencia nacional.',
    },
    // 9. Sociales & Constitución de Colombia
    {
      id: 'civics-colombia-constitution',
      category: 'Sociales // Constitución de Colombia',
      badgeCode: 'BACH-SOC-09',
      question:
        '¿En qué año se proclamó la actual Constitución Política de Colombia que consagró al país como un Estado Social de Derecho y creó la tutela?',
      hint: 'Fue redactada por la Asamblea Nacional Constituyente a principios de los años 90.',
      acceptedAnswers: ['1991', 'mil novecientos noventa y uno'],
      explanation: 'La Constitución Política de 1991 consagró el Estado Social de Derecho y la Acción de Tutela.',
    },
    // 10. Geografía de Colombia - Río Magdalena
    {
      id: 'geo-colombia-magdalena',
      category: 'Geografía de Colombia // Hidrografía',
      badgeCode: 'BACH-GEO-10',
      question:
        '¿Cuál es la principal arteria fluvial de Colombia que nace en el Macizo Colombiano y recorre el país de sur a norte hasta Bocas de Ceniza?',
      hint: 'Lleva el nombre de un departamento costero y recorre más de 1.500 km.',
      acceptedAnswers: [
        'magdalena',
        'rio magdalena',
        'el magdalena',
        'el rio magdalena',
      ],
      explanation: 'El río Magdalena es el eje fluvial más importante para la historia, economía y biodiversidad de Colombia.',
    },
    // 11. Geografía de Colombia - Las 3 Cordilleras
    {
      id: 'geo-colombia-cordilleras',
      category: 'Geografía de Colombia // Orografía',
      badgeCode: 'BACH-GEO-11',
      question:
        '¿En cuántas cordilleras principales (Occidental, Central y Oriental) se ramifica la Cordillera de los Andes al entrar al territorio colombiano?',
      hint: 'Es el primer número primo impar y el número de lados que tiene un triángulo.',
      acceptedAnswers: ['3', 'tres', '3 cordilleras', 'tres cordilleras'],
      explanation: 'En Colombia, los Andes se dividen en 3 ramales: Cordillera Occidental, Central y Oriental.',
    },
    // 12. Geografía de Colombia - Amazonas
    {
      id: 'geo-colombia-amazonas',
      category: 'Geografía de Colombia // Regiones',
      badgeCode: 'BACH-GEO-12',
      question:
        '¿Cuál es el departamento territorialmente más extenso de Colombia, ubicado en el extremo sur del país y cuya capital es Leticia?',
      hint: 'Comparte nombre con la selva tropical más biodiversa y el río más caudaloso del mundo.',
      acceptedAnswers: [
        'amazonas',
        'el amazonas',
        'departamento del amazonas',
      ],
      explanation: 'El departamento de Amazonas, con 109.665 km², es el de mayor superficie territorial en Colombia.',
    },
    // 13. Biología - ADN
    {
      id: 'bio-genetics-dna',
      category: 'Biología // Genética Molecular',
      badgeCode: 'BACH-BIO-13',
      question:
        '¿Qué macromolécula con estructura de doble hélice contiene las instrucciones genéticas y hereditarias de todos los seres vivos?',
      hint: 'Sus siglas en español corresponden a Ácido Desoxirribonucleico.',
      acceptedAnswers: ['adn', 'dna', 'el adn', 'acido desoxirribonucleico'],
      explanation: 'El ADN (Ácido Desoxirribonucleico) porta el material genético de los seres vivos.',
    },
    // 14. Biología - Mitocondria
    {
      id: 'bio-cell-mitochondria',
      category: 'Biología // Citología & Energía',
      badgeCode: 'BACH-BIO-14',
      question:
        '¿Qué organelo celular eucariota es conocido como la "central de energía" celular por llevar a cabo la respiración celular y sintetizar ATP?',
      hint: 'Posee su propio ADN circular independiente y doble membrana con crestas.',
      acceptedAnswers: [
        'mitocondria',
        'la mitocondria',
        'mitocondrias',
        'las mitocondrias',
      ],
      explanation: 'Las mitocondrias son los organelos responsables de generar energía química en forma de ATP.',
    },
    // 15. Biología - Fotosíntesis
    {
      id: 'bio-plant-photosynthesis',
      category: 'Biología // Fisiología Vegetal',
      badgeCode: 'BACH-BIO-15',
      question:
        '¿Cómo se denomina el proceso biológico mediante el cual las plantas convierten la luz solar, agua y dióxido de carbono en glucosa y oxígeno?',
      hint: 'Se realiza en los cloroplastos gracias al pigmento verde de la clorofila.',
      acceptedAnswers: ['fotosintesis', 'la fotosintesis'],
      explanation: 'La fotosíntesis permite a las plantas producir materia orgánica y liberar oxígeno vital para la biosfera.',
    },
    // 16. Informática - Sistema Binario
    {
      id: 'cs-binary-system',
      category: 'Informática // Arquitectura Digital',
      badgeCode: 'BACH-INF-16',
      question:
        '¿Cuál es el sistema de numeración posicional de base 2 que utilizan internamente los procesadores y circuitos, empleando solo ceros (0) y unos (1)?',
      hint: 'Es la base del código máquina y cada dígito individual se denomina bit.',
      acceptedAnswers: [
        'binario',
        'sistema binario',
        'el binario',
        'codigo binario',
        'base 2',
      ],
      explanation: 'El sistema binario (0 y 1) es el fundamento de la computación digital y los circuitos electrónicos.',
    },
    // 17. Informática - Protocolo HTTPS
    {
      id: 'cs-network-https',
      category: 'Informática // Redes e Internet',
      badgeCode: 'BACH-INF-17',
      question:
        '¿Qué protocolo de red cifra las comunicaciones web mediante certificados de seguridad SSL/TLS para proteger la información del usuario?',
      hint: 'Es la versión segura de HTTP y antecede con un candado a las direcciones en tu navegador.',
      acceptedAnswers: ['https', 'protocolo https', 'el https'],
      explanation: 'HTTPS (Hypertext Transfer Protocol Secure) cifra los datos transmitidos para garantizar la seguridad en internet.',
    },
    // 18. Informática - CPU / Procesador
    {
      id: 'cs-hardware-cpu',
      category: 'Informática // Hardware & Sistemas',
      badgeCode: 'BACH-INF-18',
      question:
        '¿Qué componente de hardware es conocido comúnmente como el "cerebro" del computador, responsable de ejecutar las instrucciones de los programas?',
      hint: 'Se conoce por sus siglas en inglés CPU o microprocesador central.',
      acceptedAnswers: [
        'cpu',
        'procesador',
        'el cpu',
        'el procesador',
        'microprocesador',
        'la cpu',
      ],
      explanation: 'La CPU (Central Processing Unit) es la encargada de procesar datos y ejecutar instrucciones de software.',
    },
  ];

  currentRiddleIndex = signal<number>(0);
  currentRiddle = signal<Riddle>(this.riddles[0]);

  ngOnInit(): void {
    const randomIndex = Math.floor(Math.random() * this.riddles.length);
    this.currentRiddleIndex.set(randomIndex);
    this.currentRiddle.set(this.riddles[randomIndex]);
  }

  nextRiddle(): void {
    const nextIdx = (this.currentRiddleIndex() + 1) % this.riddles.length;
    this.currentRiddleIndex.set(nextIdx);
    this.currentRiddle.set(this.riddles[nextIdx]);
    this.userAnswer = '';
    this.showHint.set(false);
    this.clearError();
  }

  clearError(): void {
    this.hasError.set(false);
    this.errorMessage.set(null);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    const raw = this.userAnswer.trim();
    if (!raw) {
      this.hasError.set(true);
      this.errorMessage.set('ERROR: Ingresa una respuesta.');
      return;
    }

    const isMatch = this.checkAnswer(raw, this.currentRiddle().acceptedAnswers);

    if (isMatch) {
      this.isSolved.set(true);
      this.hasError.set(false);
      this.errorMessage.set(null);
      this.sound.playSuccess();

      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem('edubid_arcade_unlocked', 'true');
        } catch {
          // Ignorado en SSR o entornos restringidos
        }
      }

      setTimeout(() => {
        this.unlocked.emit();
      }, 1400);
    } else {
      this.hasError.set(true);
      this.sound.playAlert();
      this.errorMessage.set('ERROR: Respuesta incorrecta. Consulta la pista pedagógica.');
    }
  }

  private checkAnswer(userRaw: string, accepted: string[]): boolean {
    const clean = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const user = clean(userRaw);
    if (!user) return false;

    // Eliminar artículos y conectores introductorios comunes
    const strippedUser = user
      .replace(
        /^(es|son|el|la|los|las|un|una|unos|unas|el numero|numero|el rio|rio|la batalla de|batalla de|ano|el ano|del|de la|de)\s+/i,
        ''
      )
      .trim();

    return accepted.some((ans) => {
      const target = clean(ans);
      if (!target) return false;

      // 1. Coincidencia exacta directa
      if (user === target || strippedUser === target) return true;

      // 2. Coincidencia con límites de palabra (evita falsos positivos como '180' en '1800')
      const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordRegex = new RegExp(`(^|\\s)${escaped}($|\\s)`);
      if (wordRegex.test(user) || wordRegex.test(strippedUser)) return true;

      // 3. Si la respuesta esperada tiene múltiples palabras (ej. "gabriel garcia marquez")
      if (target.includes(' ') && user.includes(' ')) {
        const userWords = user.split(' ');
        const targetWords = target.split(' ');
        if (targetWords.every((w) => userWords.includes(w))) return true;
      }

      return false;
    });
  }
}
