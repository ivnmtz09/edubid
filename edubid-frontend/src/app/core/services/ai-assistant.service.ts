import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { AI_ENDPOINTS } from '../constants/api.constants';

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
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
  private actionCompletedSubject = new Subject<AiActionCompletedEvent>();

  /**
   * Observable reactivo emitido cada vez que EDUBID IA ejecuta herramientas en el backend.
   * Permite que componentes como Clases, Dashboard o Actividades se sincronicen en tiempo real
   * de forma 100% dinámica sin necesidad de que el usuario recargue manualmente la pantalla (F5).
   */
  readonly actionCompleted$: Observable<AiActionCompletedEvent> = this.actionCompletedSubject.asObservable();

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
