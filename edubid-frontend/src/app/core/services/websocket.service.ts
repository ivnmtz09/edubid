import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BidUpdateEvent {
  event: 'bid_created';
  auction_id: number;
  auction_titulo: string;
  grupo_id: number;
  puja_mas_alta: {
    cantidad_educoins: number;
    estudiante_nombre: string;
    estudiante_id: number;
  };
  total_pujas: number;
  incremento_minimo_educoins: number;
  estudiante_anterior_id?: number | null;
}

export interface AuctionClosedEvent {
  event: 'auction_closed';
  auction_id: number;
  auction_titulo: string;
  grupo_id: number;
  ganador?: {
    id: number;
    email: string;
    nombre: string;
    monto_pagado: number;
  } | null;
  total_participantes: number;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private socket: WebSocket | null = null;
  private messageSubject$ = new Subject<any>();
  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectDelay = 30000;
  private isDestroyed = false;

  constructor() {
    this.connect();
  }

  private getWebSocketUrl(): string {
    const apiUrl = environment.apiUrl || 'http://localhost:8000/api';
    // Reemplazar http:// o https:// por ws:// o wss://
    let wsUrl = apiUrl.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://');
    // Remover sufijo /api si existe para apuntar a /ws/auctions/
    wsUrl = wsUrl.replace(/\/api\/?$/, '');
    return `${wsUrl}/ws/auctions/`;
  }

  connect(): void {
    if (this.isDestroyed) return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = this.getWebSocketUrl();
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('⚡ [EduBid Real-Time] Conexión WebSocket establecida exitosamente.');
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageSubject$.next(data);
        } catch (e) {
          console.warn('⚠️ [EduBid Real-Time] Error al parsear mensaje WebSocket:', e);
        }
      };

      this.socket.onclose = () => {
        if (!this.isDestroyed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.warn('⚠️ [EduBid Real-Time] Advertencia en WebSocket (reintentando...):', error);
        this.socket?.close();
      };
    } catch (err) {
      console.warn('⚠️ [EduBid Real-Time] Error iniciando WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isDestroyed) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Stream observable de todos los mensajes recibidos del WebSocket
   */
  get messages$(): Observable<any> {
    return this.messageSubject$.asObservable();
  }

  /**
   * Stream filtrado para actualizaciones de nuevas pujas en tiempo real
   */
  onBidUpdate$(): Observable<BidUpdateEvent> {
    return this.messages$.pipe(
      filter((msg) => msg && msg.event === 'bid_created'),
      map((msg) => msg as BidUpdateEvent)
    );
  }

  /**
   * Stream filtrado para eventos de cierre de subasta en tiempo real
   */
  onAuctionClosed$(): Observable<AuctionClosedEvent> {
    return this.messages$.pipe(
      filter((msg) => msg && msg.event === 'auction_closed'),
      map((msg) => msg as AuctionClosedEvent)
    );
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

