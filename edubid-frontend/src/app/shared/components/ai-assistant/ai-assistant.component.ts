import {
  Component,
  inject,
  signal,
  computed,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import {
  AiAssistantService,
  AiChatMessage,
} from '../../../core/services/ai-assistant.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (canAccess()) {
      <!-- CONTENEDOR FLOTANTE -->
      <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        
        <!-- ================= VENTANA DEL CHATBOT ================= -->
        @if (isOpen()) {
          <div
            class="mb-3 w-[92vw] sm:w-[420px] h-[580px] max-h-[82vh] bg-surface/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 origin-bottom-right"
          >
            <!-- CABECERA -->
            <div
              class="px-4 py-3.5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border flex items-center justify-between shrink-0"
            >
              <div class="flex items-center gap-3">
                <!-- Avatar Bot con indicador de estado -->
                <div class="relative">
                  <div
                    class="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-orange-400 text-white flex items-center justify-center shadow-md shadow-primary/20"
                  >
                    <!-- Icono Bot SVG -->
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="18" height="12" x="3" y="8" rx="2" />
                      <path d="M12 2v6" />
                      <path d="M9 14h.01" />
                      <path d="M15 14h.01" />
                      <path d="M7 20v2" />
                      <path d="M17 20v2" />
                    </svg>
                  </div>
                  <span
                    class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-surface rounded-full animate-pulse"
                    title="En línea"
                  ></span>
                </div>

                <div>
                  <div class="flex items-center gap-1.5">
                    <h3 class="font-bold text-sm text-text leading-tight tracking-tight">EDUBID IA</h3>
                    <span class="px-1.5 py-0.5 text-[10px] font-extrabold uppercase bg-primary/15 text-primary rounded-md">
                      GPT-4o
                    </span>
                  </div>
                  <p class="text-xs text-text-muted leading-tight mt-0.5">
                    {{ roleSubtitle() }}
                  </p>
                </div>
              </div>

              <!-- Acciones Cabecera -->
              <div class="flex items-center gap-1">
                <!-- Limpiar chat -->
                @if (messages().length > 0) {
                  <button
                    type="button"
                    (click)="clearChat()"
                    title="Reiniciar conversación"
                    class="p-1.5 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                }

                <!-- Cerrar ventana -->
                <button
                  type="button"
                  (click)="toggleChat()"
                  title="Cerrar chat"
                  class="p-1.5 text-text-muted hover:text-text hover:bg-border/60 rounded-lg transition-colors"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- CUERPO DE MENSAJES -->
            <div
              #scrollContainer
              class="flex-1 p-4 overflow-y-auto space-y-3.5 scroll-smooth text-sm"
            >
              <!-- BIENVENIDA SI NO HAY MENSAJES -->
              @if (messages().length === 0) {
                <div class="space-y-4 my-2">
                  <div class="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-surface to-surface border border-primary/20 text-center space-y-2">
                    <div class="w-12 h-12 mx-auto rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                      <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="18" height="12" x="3" y="8" rx="2" />
                        <path d="M12 2v6" />
                        <path d="M9 14h.01" />
                        <path d="M15 14h.01" />
                      </svg>
                    </div>
                    <h4 class="font-bold text-text text-base">¡Hola, {{ userName() }}! 👋</h4>
                    <p class="text-xs text-text-muted leading-relaxed">
                      Soy **EDUBID IA**, tu asistente inteligente con GPT-4o. Estoy listo para ayudarte con rúbricas, planeaciones de clase, ideas para subastas con EduCoins, convivencia y gestión educativa.
                    </p>
                  </div>

                  <!-- SUGERENCIAS RÁPIDAS -->
                  <div class="space-y-1.5">
                    <p class="text-[11px] font-bold text-text-muted uppercase tracking-wider px-1">
                      Ideas rápidas para empezar:
                    </p>
                    <div class="space-y-1.5">
                      @for (sugg of suggestions(); track sugg) {
                        <button
                          type="button"
                          (click)="sendSuggestion(sugg)"
                          class="w-full text-left p-2.5 rounded-xl bg-surface hover:bg-primary/10 border border-border hover:border-primary/40 text-xs text-text transition-all duration-150 flex items-start gap-2 group"
                        >
                          <span class="text-primary mt-0.5 group-hover:scale-110 transition-transform">✨</span>
                          <span class="flex-1">{{ sugg }}</span>
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }

              <!-- LISTADO DE MENSAJES -->
              @for (msg of messages(); track $index) {
                <!-- MENSAJE DEL USUARIO -->
                @if (msg.role === 'user') {
                  <div class="flex justify-end items-end gap-2">
                    <div
                      class="max-w-[85%] rounded-2xl rounded-br-xs px-3.5 py-2.5 bg-primary text-white text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-words"
                    >
                      {{ msg.content }}
                    </div>
                  </div>
                }

                <!-- MENSAJE DE LA IA -->
                @if (msg.role === 'assistant') {
                  <div class="flex items-start gap-2.5">
                    <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-orange-400 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="18" height="12" x="3" y="8" rx="2" />
                        <path d="M12 2v6" />
                        <path d="M9 14h.01" />
                        <path d="M15 14h.01" />
                      </svg>
                    </div>

                    <div class="max-w-[85%] space-y-1">
                      <div
                        class="rounded-2xl rounded-tl-xs px-3.5 py-2.5 bg-border/40 text-text border border-border text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words"
                        [innerHTML]="formatMarkdown(msg.content)"
                      ></div>

                      <!-- Acciones mensaje IA -->
                      <div class="flex items-center gap-2 px-1">
                        <button
                          type="button"
                          (click)="copyToClipboard(msg.content)"
                          class="text-[10px] text-text-muted hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                          </svg>
                          Copiar
                        </button>
                      </div>
                    </div>
                  </div>
                }
              }

              <!-- INDICADOR DE PENSANDO / CARGANDO -->
              @if (isLoading()) {
                <div class="flex items-center gap-2.5 text-text-muted py-1">
                  <div class="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10"/>
                    </svg>
                  </div>
                  <div class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-border/30 border border-border text-xs">
                    <span>EDUBID IA está pensando</span>
                    <span class="flex gap-1 items-center">
                      <span class="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
                      <span class="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></span>
                      <span class="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                  </div>
                </div>
              }
            </div>

            <!-- PIE / INPUT DE TEXTO -->
            <div class="p-3 bg-surface border-t border-border shrink-0">
              <form (submit)="onSubmit($event)" class="relative flex items-center">
                <textarea
                  #inputBox
                  [(ngModel)]="userInput"
                  name="userInput"
                  (keydown.enter)="onEnterPress($event)"
                  rows="1"
                  [disabled]="isLoading()"
                  placeholder="Pregúntale a EDUBID IA sobre clases, dinámicas..."
                  class="w-full resize-none rounded-xl bg-bg border border-border focus:border-primary focus:ring-1 focus:ring-primary pl-3.5 pr-11 py-2.5 text-xs sm:text-sm text-text placeholder:text-text-muted/70 outline-hidden transition-all duration-150 max-h-28"
                ></textarea>

                <button
                  type="submit"
                  [disabled]="!canSend()"
                  title="Enviar mensaje"
                  class="absolute right-2 p-1.5 rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 transition-all duration-150 shadow-xs"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>

              <div class="mt-1.5 flex items-center justify-between px-1 text-[10px] text-text-muted">
                <span>Presiona Enter para enviar, Shift+Enter para salto de línea</span>
                <span class="font-medium text-primary/80">EduBid • IA Educativa</span>
              </div>
            </div>
          </div>
        }

        <!-- ================= BOTÓN FLOTANTE (TRIGGER) ================= -->
        <button
          type="button"
          (click)="toggleChat()"
          class="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
          [attr.aria-expanded]="isOpen()"
          aria-label="Abrir EDUBID IA"
        >
          <!-- Efecto resplandor / pulse -->
          <span
            class="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary to-orange-400 opacity-60 blur-xs group-hover:opacity-100 transition-opacity animate-pulse"
          ></span>

          <!-- Contenido del botón -->
          <div class="relative flex items-center gap-2.5">
            <!-- Icono Bot -->
            <div class="w-6 h-6 flex items-center justify-center">
              @if (isOpen()) {
                <svg class="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              } @else {
                <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="12" x="3" y="8" rx="2" />
                  <path d="M12 2v6" />
                  <path d="M9 14h.01" />
                  <path d="M15 14h.01" />
                  <path d="M7 20v2" />
                  <path d="M17 20v2" />
                </svg>
              }
            </div>

            <span class="font-bold text-xs tracking-wide uppercase pr-0.5">
              EDUBID IA
            </span>
          </div>
        </button>

      </div>
    }
  `,
})
export class AiAssistantComponent implements OnInit, AfterViewChecked {
  private authService = inject(AuthService);
  private aiService = inject(AiAssistantService);

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('inputBox') private inputBox?: ElementRef<HTMLTextAreaElement>;

  isOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  userInput = '';
  messages = signal<AiChatMessage[]>([]);
  suggestions = signal<string[]>([]);

  private shouldScroll = false;

  readonly canAccess = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return false;
    return ['docente', 'coordinador', 'rector', 'admin'].includes(user.role);
  });

  readonly userName = computed(() => {
    const user = this.authService.currentUser();
    return user?.first_name || user?.email?.split('@')[0] || 'Colega';
  });

  readonly roleSubtitle = computed(() => {
    const role = this.authService.currentUser()?.role;
    switch (role) {
      case 'docente':
        return 'Copiloto Pedagógico de Aula';
      case 'coordinador':
        return 'Asistente de Coordinación Académica';
      case 'rector':
        return 'Asesor de Rectoría y Gestión Escolar';
      case 'admin':
        return 'Asistente de Administración Global';
      default:
        return 'Asistente Educativo Inteligente';
    }
  });

  readonly canSend = computed(() => {
    return this.userInput.trim().length > 0 && !this.isLoading();
  });

  ngOnInit(): void {
    if (this.canAccess()) {
      this.loadSuggestions();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleChat(): void {
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.shouldScroll = true;
      setTimeout(() => this.inputBox?.nativeElement.focus(), 150);
    }
  }

  clearChat(): void {
    this.messages.set([]);
  }

  loadSuggestions(): void {
    this.aiService.getSuggestions().subscribe({
      next: (res) => {
        if (res.suggestions?.length) {
          this.suggestions.set(res.suggestions);
        }
      },
      error: () => {
        // Sugerencias por defecto si falla la petición
        this.suggestions.set([
          'Genera una rúbrica de 4 niveles para evaluar una actividad de clase.',
          'Dame 3 ideas de recompensas educativas para subastas con EduCoins.',
          '¿Cómo motivar a estudiantes con bajo rendimiento académico?',
        ]);
      },
    });
  }

  sendSuggestion(suggestion: string): void {
    this.userInput = suggestion;
    this.sendMessage();
  }

  onEnterPress(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendMessage();
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.sendMessage();
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isLoading()) return;

    // Agregar mensaje del usuario al chat
    const userMsg: AiChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    this.messages.update((msgs) => [...msgs, userMsg]);
    this.userInput = '';
    this.isLoading.set(true);
    this.shouldScroll = true;

    // Preparar el historial para el backend (solo role y content)
    const payloadMessages = this.messages().map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    this.aiService.sendMessage(payloadMessages).subscribe({
      next: (response) => {
        const aiMsg: AiChatMessage = {
          role: 'assistant',
          content: response.content,
          model: response.model,
          timestamp: new Date(),
        };
        this.messages.update((msgs) => [...msgs, aiMsg]);
        this.isLoading.set(false);
        this.shouldScroll = true;
      },
      error: (error) => {
        const errorDetail =
          error?.error?.detail ||
          'Lo siento, ocurrió un error al conectar con EDUBID IA. Por favor intenta de nuevo.';
        const errorMsg: AiChatMessage = {
          role: 'assistant',
          content: `⚠️ **Error:** ${errorDetail}`,
          timestamp: new Date(),
        };
        this.messages.update((msgs) => [...msgs, errorMsg]);
        this.isLoading.set(false);
        this.shouldScroll = true;
      },
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard?.writeText(text);
  }

  formatMarkdown(content: string): string {
    if (!content) return '';
    // Formateo básico de markdown seguro
    let formatted = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Negritas **texto**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Cursiva *texto*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Listas con viñeta (- item)
    formatted = formatted.replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>');

    // Listas numeradas (1. item)
    formatted = formatted.replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li class="ml-4 list-decimal"><strong>$1.</strong> $2</li>');

    return formatted;
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    }
  }
}
