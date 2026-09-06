import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StudentGrade {
  id: number;
  activity: number;
  activity_nombre?: string;
  student: number;
  nota: number;
  comentarios?: string;
  creado: string;
  coins_ganados?: number;
}

export interface MyGradesResponse {
  promedio_general: number;
  total_educoins_ganados: number;
  calificaciones: StudentGrade[];
}

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/grades`;

  getMyGrades(): Observable<MyGradesResponse> {
    return this.http.get<MyGradesResponse>(`${this.apiUrl}/mis-notas/`);
  }
}
