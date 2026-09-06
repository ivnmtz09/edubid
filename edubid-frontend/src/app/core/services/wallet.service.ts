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

  getMyWallet(): Observable<Wallet> {
    return this.http.get<Wallet>(`${this.apiUrl}/wallets/mi-wallet/`);
  }

  getWallets(): Observable<Wallet[]> {
    return this.http.get<Wallet[]>(`${this.apiUrl}/wallets/`);
  }

  getTransactions(): Observable<CoinTransaction[]> {
    return this.http.get<CoinTransaction[]>(`${this.apiUrl}/transactions/`);
  }
}
