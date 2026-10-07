import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  sendMessage(messages: Array<{ role: 'user' | 'assistant'; content: string }>, context?: string): Observable<AiChatResponse> {
    const payload: AiChatRequest = { messages, context };
    return this.http.post<AiChatResponse>(AI_ENDPOINTS.CHAT, payload);
  }

  getSuggestions(): Observable<AiSuggestionsResponse> {
    return this.http.get<AiSuggestionsResponse>(AI_ENDPOINTS.SUGGESTIONS);
  }
}
