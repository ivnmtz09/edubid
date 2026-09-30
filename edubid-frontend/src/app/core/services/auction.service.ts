import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HighestBid {
  cantidad_educoins: number;
  estudiante_nombre: string;
}

export interface AuctionBid {
  id: number;
  auction: number;
  auction_titulo?: string;
  estudiante: number;
  estudiante_email?: string;
  estudiante_nombre?: string;
  cantidad_educoins: number;
  creado: string;
}

export interface Auction {
  id: number;
  titulo: string;
  descripcion: string;
  creador: number;
  creador_email?: string;
  creador_nombre?: string;
  grupo: number;
  grupo_nombre?: string;
  valor_minimo_educoins: number;
  incremento_minimo_educoins: number;
  fecha_fin: string;
  estado: 'active' | 'scheduled' | 'closed';
  total_pujas: number;
  puja_mas_alta?: HighestBid | null;
  puja_ganadora?: any;
  bids?: AuctionBid[];
  creado?: string;
}

export interface CloseAuctionResponse {
  detail: string;
  ganador?: {
    id: number;
    nombre: string;
    email: string;
    monto_pagado: number;
  };
  total_participantes?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuctionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auctions`;

  getAuctions(): Observable<Auction[]> {
    return this.http.get<Auction[]>(`${this.apiUrl}/auctions/`);
  }

  getAuction(id: number): Observable<Auction> {
    return this.http.get<Auction>(`${this.apiUrl}/auctions/${id}/`);
  }

  createAuction(data: Partial<Auction>): Observable<Auction> {
    return this.http.post<Auction>(`${this.apiUrl}/auctions/`, data);
  }

  closeAuction(auctionId: number): Observable<CloseAuctionResponse> {
    return this.http.post<CloseAuctionResponse>(`${this.apiUrl}/auctions/${auctionId}/close/`, {});
  }

  deleteAuction(auctionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/auctions/${auctionId}/`);
  }

  getBids(params?: { auction?: number }): Observable<AuctionBid[]> {
    const url = params?.auction
      ? `${this.apiUrl}/bids/?auction=${params.auction}`
      : `${this.apiUrl}/bids/`;
    return this.http.get<AuctionBid[]>(url);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auctions/stats/`);
  }

  createBid(auctionId: number, cantidad: number): Observable<AuctionBid> {
    return this.http.post<AuctionBid>(`${this.apiUrl}/bids/`, {
      auction: auctionId,
      cantidad_educoins: cantidad
    });
  }

  autorizarPujaDocente(auctionId: number, autorizado: boolean): Observable<{ autorizado: boolean; mensaje: string }> {
    return this.http.post<{ autorizado: boolean; mensaje: string }>(`${this.apiUrl}/auctions/${auctionId}/autorizar_puja_docente/`, { autorizado });
  }

  getPermisoPujaDocente(auctionId: number): Observable<{ autorizado: boolean }> {
    return this.http.get<{ autorizado: boolean }>(`${this.apiUrl}/auctions/${auctionId}/autorizar_puja_docente/`);
  }

  getEstudiantesConPermiso(auctionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/auctions/${auctionId}/permisos_proxy/`);
  }

  pujaProxy(auctionId: number, estudianteId: number, cantidad: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auctions/${auctionId}/puja_proxy/`, {
      estudiante_id: estudianteId,
      cantidad_educoins: cantidad
    });
  }
}

