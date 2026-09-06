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

  createBid(auctionId: number, cantidad: number): Observable<AuctionBid> {
    return this.http.post<AuctionBid>(`${this.apiUrl}/bids/`, {
      auction: auctionId,
      cantidad_educoins: cantidad
    });
  }
}
