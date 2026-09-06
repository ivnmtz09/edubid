import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Activity {
  id: number;
  group: number;
  tipo: string;
  nombre: string;
  descripcion: string;
  valor_educoins: number;
  puntos_experiencia: number;
  fecha_entrega: string;
  habilitada: boolean;
  archivo_adjunto?: string | null;
  classroom?: number;
  puede_entregar?: boolean;
  esta_vencida?: boolean;
  tiempo_restante?: string;
}

export interface Submission {
  id: number;
  activity: number;
  activity_nombre?: string;
  estudiante: number;
  estudiante_nombre?: string;
  estudiante_email?: string;
  archivo?: string | null;
  comentarios?: string;
  creado: string;
  grade?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getActivities(groupId?: number): Observable<Activity[]> {
    const url = groupId
      ? `${this.apiUrl}/activities/?group=${groupId}`
      : `${this.apiUrl}/activities/`;
    return this.http.get<Activity[]>(url);
  }

  getSubmissions(activityId?: number): Observable<Submission[]> {
    const url = activityId
      ? `${this.apiUrl}/submissions/?activity=${activityId}`
      : `${this.apiUrl}/submissions/`;
    return this.http.get<Submission[]>(url);
  }
}
