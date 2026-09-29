import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InAppNotification {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  activity_id?: number | null;
  grade_id?: number | null;
  auction_id?: number | null;
  metadata?: Record<string, any> | null;
  creado: string;
  tiempo_transcurrido?: string | null;
}

export interface NotificationStats {
  total: number;
  no_leidas: number;
  leidas: number;
  por_tipo?: Record<string, number>;
}

@Injectable({
  providedIn: 'root',
})
export class InAppNotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;

  notifications = signal<InAppNotification[]>([]);
  unreadCount = signal<number>(0);
  isLoading = signal<boolean>(false);

  loadNotifications(): Observable<any> {
    this.isLoading.set(true);
    return this.http.get<any>(`${this.apiUrl}/`).pipe(
      tap((res) => {
        const items: InAppNotification[] = Array.isArray(res) ? res : res?.results || [];
        this.notifications.set(items);
        const unread = items.filter((n) => !n.leida).length;
        this.unreadCount.set(unread);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        return of([]);
      })
    );
  }

  loadUnreadCount(): Observable<NotificationStats | null> {
    return this.http.get<NotificationStats>(`${this.apiUrl}/estadisticas/`).pipe(
      tap((stats) => {
        if (stats && typeof stats.no_leidas === 'number') {
          this.unreadCount.set(stats.no_leidas);
        }
      }),
      catchError(() => of(null))
    );
  }

  markAsRead(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/marcar-leida/`, {}).pipe(
      tap(() => {
        this.notifications.update((list) =>
          list.map((n) => (n.id === id ? { ...n, leida: true } : n))
        );
        this.unreadCount.update((count) => Math.max(0, count - 1));
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/marcar-todas-leidas/`, {}).pipe(
      tap(() => {
        this.notifications.update((list) => list.map((n) => ({ ...n, leida: true })));
        this.unreadCount.set(0);
      })
    );
  }

  clearAll(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/eliminar-todas/`).pipe(
      tap(() => {
        this.notifications.set([]);
        this.unreadCount.set(0);
      })
    );
  }
}
