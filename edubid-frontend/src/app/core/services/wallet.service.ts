import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CoinTransaction {
  id: number;
  wallet: number;
  tipo: string;
  cantidad_educoins: number;
  descripcion: string;
  creado: string;
}

export interface Wallet {
  id: number;
  usuario: number;
  usuario_email: string;
  grupo: number;
  grupo_nombre: string;
  periodo: number;
  periodo_nombre: string;
  saldo_educoins: number;
  bloqueado_educoins: number;
  saldo_disponible: number;
  transacciones?: CoinTransaction[];
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tokens`;

  getMyWallet(grupoId?: number): Observable<Wallet> {
    const query = grupoId ? `?grupo=${grupoId}` : '';
    return this.http.get<Wallet>(`${this.apiUrl}/wallets/mi-wallet/${query}`);
  }

  getMiWallet(grupoId?: number): Observable<Wallet> {
    return this.getMyWallet(grupoId);
  }

  getWallet(id: number): Observable<Wallet> {
    return this.http.get<Wallet>(`${this.apiUrl}/wallets/${id}/`);
  }

  getWallets(params?: { grupo?: number; classroom?: number }): Observable<Wallet[]> {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.grupo) q.set('grupo', String(params.grupo));
      if (params.classroom) q.set('classroom', String(params.classroom));
      const str = q.toString();
      if (str) query = `?${str}`;
    }
    return this.http.get<Wallet[]>(`${this.apiUrl}/wallets/${query}`);
  }

  depositar(walletId: number, cantidad: number, descripcion: string = 'Bonificación del docente'): Observable<Wallet> {
    return this.http.post<Wallet>(`${this.apiUrl}/wallets/${walletId}/depositar/`, {
      cantidad,
      descripcion
    });
  }

  getTransactions(): Observable<CoinTransaction[]> {
    return this.http.get<CoinTransaction[]>(`${this.apiUrl}/transactions/`);
  }
}
