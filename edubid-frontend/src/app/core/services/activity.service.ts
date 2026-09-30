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
  group_nombre?: string;
  creado?: string;
  puede_entregar?: boolean;
  esta_vencida?: boolean;
  tiempo_restante?: string;
  submissions?: Submission[];
  user_submission?: any;
}

export interface Submission {
  id: number;
  activity: number;
  activity_nombre?: string;
  estudiante: number | { id: number; email: string; first_name: string; last_name: string };
  estudiante_nombre?: string;
  estudiante_email?: string;
  contenido?: string;
  archivo?: string | null;
  calificacion?: number | null;
  retroalimentacion?: string | null;
  creado: string;
  actualizado?: string;
  grade?: any;
}

export interface GradeSubmissionResponse {
  mensaje: string;
  submission_id: number;
  nota: number;
  retroalimentacion: string;
  grade_id: number;
  coins_ganados: number;
  wallet_saldo: number;
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

  createActivity(data: FormData | Partial<Activity>): Observable<Activity> {
    return this.http.post<Activity>(`${this.apiUrl}/activities/`, data);
  }

  updateActivity(id: number, data: Partial<Activity>): Observable<Activity> {
    return this.http.patch<Activity>(`${this.apiUrl}/activities/${id}/`, data);
  }

  deleteActivity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/activities/${id}/`);
  }

  getSubmissions(activityId?: number): Observable<Submission[]> {
    const url = activityId
      ? `${this.apiUrl}/submissions/?activity=${activityId}`
      : `${this.apiUrl}/submissions/`;
    return this.http.get<Submission[]>(url);
  }

  submitActivity(data: FormData): Observable<Submission> {
    return this.http.post<Submission>(`${this.apiUrl}/submissions/`, data);
  }

  gradeSubmission(
    submissionId: number,
    data: { nota: number; retroalimentacion?: string }
  ): Observable<GradeSubmissionResponse> {
    return this.http.patch<GradeSubmissionResponse>(
      `${this.apiUrl}/submissions/${submissionId}/grade/`,
      data
    );
  }

  cancelSubmission(submissionId: number): Observable<{ detail: string }> {
    return this.http.delete<{ detail: string }>(
      `${this.apiUrl}/submissions/${submissionId}/`
    );
  }
}
