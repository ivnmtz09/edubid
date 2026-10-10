import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap, catchError, of } from 'rxjs';
import { AI_ENDPOINTS, STORAGE_KEYS } from '../constants/api.constants';
import { AuthService } from './auth.service';

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date | string;
  model?: string;
}

export interface AiChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: string;
}

export interface AiChatResponse {
  status: string;
  role: 'assistant';
  content: string;
  model: string;
  author: string;
  executed_tools?: string[];
}

export interface AiActionCompletedEvent {
  tools: string[];
}

export interface AiSuggestionsResponse {
  role: string;
  suggestions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private actionCompletedSubject = new Subject<AiActionCompletedEvent>();

  /**
   * Observable reactivo emitido cada vez que EDUBID IA ejecuta herramientas en el backend.
   * Permite que componentes como Clases, Dashboard o Actividades se sincronicen en tiempo real
   * de forma 100% dinámica sin necesidad de que el usuario recargue manualmente la pantalla (F5).
   */
  readonly actionCompleted$: Observable<AiActionCompletedEvent> = this.actionCompletedSubject.asObservable();

  // Estados Reactivos con Signals para el Asistente IA
  readonly messages = signal<AiChatMessage[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly activeModel = signal<string>('gemini-3.6-flash');
  readonly draftText = signal<string>('');
  readonly suggestions = signal<string[]>([]);
  readonly showSuggestionsTray = signal<boolean>(false);

  constructor() {
    this.loadMessagesFromStorage();
    this.loadSuggestions();

    // Sincronizar historial si el usuario cambia de sesión
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadMessagesFromStorage();
        this.loadSuggestions();
      } else {
        this.messages.set([]);
      }
    });
  }

  private getStorageKey(): string {
    const user = this.authService.currentUser();
    return user?.id ? `${STORAGE_KEYS.AI_CHAT_PREFIX}${user.id}` : `${STORAGE_KEYS.AI_CHAT_PREFIX}guest`;
  }

  loadMessagesFromStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const key = this.getStorageKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.messages.set(parsed);
          return;
        }
      }
      this.messages.set([]);
    } catch {
      this.messages.set([]);
    }
  }

  private saveMessagesToStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(this.messages()));
    } catch {
      // Ignorar errores de cuota en entornos restringidos
    }
  }

  clearChat(): void {
    this.messages.set([]);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(this.getStorageKey());
      } catch {}
    }
  }

  setDraft(text: string): void {
    this.draftText.set(text);
  }

  toggleSuggestionsTray(): void {
    this.showSuggestionsTray.update((v) => !v);
  }

  setSuggestionsTray(visible: boolean): void {
    this.showSuggestionsTray.set(visible);
  }

  loadSuggestions(): void {
    this.getSuggestions().subscribe({
      next: (res) => {
        if (res.suggestions?.length) {
          this.suggestions.set(res.suggestions);
        }
      },
      error: () => {
        this.suggestions.set([
          '¿Qué asignaturas y grupos tengo actualmente a mi cargo?',
          'Dame 3 ideas pedagógicas de recompensas para motivar con EduCoins.',
          '¿Cómo estructurar una rúbrica formativa para una actividad?',
          '¿Qué estudiantes tienen entregas pendientes por calificar?',
        ]);
      },
    });
  }

  sendUserMessage(text: string, context?: string): void {
    const trimmed = text.trim();
    if (!trimmed || this.isLoading()) return;

    const userMsg: AiChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    this.messages.update((msgs) => [...msgs, userMsg]);
    this.saveMessagesToStorage();
    this.draftText.set('');
    this.isLoading.set(true);

    const payloadMessages = this.messages().map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    this.sendMessage(payloadMessages, context).subscribe({
      next: (response) => {
        const aiMsg: AiChatMessage = {
          role: 'assistant',
          content: response.content,
          model: response.model,
          timestamp: new Date().toISOString(),
        };
        if (response.model) {
          this.activeModel.set(response.model);
        }
        this.messages.update((msgs) => [...msgs, aiMsg]);
        this.saveMessagesToStorage();
        this.isLoading.set(false);
      },
      error: (error) => {
        const errorDetail =
          error?.error?.detail ||
          'Lo siento, ocurrió un error al conectar con EDUBID IA. Por favor intenta de nuevo.';
        const errorMsg: AiChatMessage = {
          role: 'assistant',
          content: `**Error:** ${errorDetail}`,
          timestamp: new Date().toISOString(),
        };
        this.messages.update((msgs) => [...msgs, errorMsg]);
        this.saveMessagesToStorage();
        this.isLoading.set(false);
      },
    });
  }

  sendMessage(messages: Array<{ role: 'user' | 'assistant'; content: string }>, context?: string): Observable<AiChatResponse> {
    const payload: AiChatRequest = { messages, context };
    return this.http.post<AiChatResponse>(AI_ENDPOINTS.CHAT, payload).pipe(
      tap((response) => {
        if (response.executed_tools && response.executed_tools.length > 0) {
          this.actionCompletedSubject.next({ tools: response.executed_tools });
        }
      })
    );
  }

  getSuggestions(): Observable<AiSuggestionsResponse> {
    return this.http.get<AiSuggestionsResponse>(AI_ENDPOINTS.SUGGESTIONS);
  }
}
