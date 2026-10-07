import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subscription, interval, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';
import { SoundService } from './sound.service';

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
  private toastr = inject(NotificationService);
  private soundService = inject(SoundService);
  private apiUrl = `${environment.apiUrl}/notifications`;

  notifications = signal<InAppNotification[]>([]);
  unreadCount = signal<number>(0);
  isLoading = signal<boolean>(false);
  hasNewNotificationAnimation = signal<boolean>(false);

  private pollingSub: Subscription | null = null;
  private previousUnreadCount = 0;
  private hasLoadedInitial = false;

  loadNotifications(showLoading = true, isSilent = false): Observable<any> {
    if (showLoading) {
      this.isLoading.set(true);
    }
    let headers = new HttpHeaders();
    if (isSilent) {
      headers = headers.set('X-Skip-Error-Toast', 'true');
    }
    return this.http.get<any>(`${this.apiUrl}/`, { headers }).pipe(
      tap((res) => {
        const items: InAppNotification[] = Array.isArray(res) ? res : res?.results || [];
        this.notifications.set(items);
        const unread = items.filter((n) => !n.leida).length;
        this.updateUnreadCount(unread);
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
          this.updateUnreadCount(stats.no_leidas);
        }
      }),
      catchError(() => of(null))
    );
  }

  startPolling(intervalMs = 10000): void {
    this.stopPolling();
    // Carga inicial inmediata
    this.refreshAllSilently();

    // Polling periódico cada 10 segundos
    this.pollingSub = interval(intervalMs).subscribe(() => {
      this.refreshAllSilently();
    });
  }

  stopPolling(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = null;
    }
  }

  private refreshAllSilently(): void {
    this.loadNotifications(false, true).subscribe();
  }

  private updateUnreadCount(newCount: number): void {
    const prev = this.unreadCount();
    this.unreadCount.set(newCount);

    // Si aumentaron las notificaciones no leídas después de la carga inicial
    if (this.hasLoadedInitial) {
      if (newCount > prev) {
        this.soundService.playNotification();
        this.hasNewNotificationAnimation.set(true);
        setTimeout(() => this.hasNewNotificationAnimation.set(false), 3500);

        // Mostrar toast emergente en tiempo real
        const newest = this.notifications().find((n) => !n.leida);
        if (newest) {
          this.toastr.info(newest.mensaje, newest.titulo);
        }
      }
    } else {
      this.hasLoadedInitial = true;
    }
    this.previousUnreadCount = newCount;
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

