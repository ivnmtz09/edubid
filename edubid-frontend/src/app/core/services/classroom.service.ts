import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ClassroomGroup {
  id: number;
  nombre: string;
  descripcion?: string;
  codigo?: string;
  codigo_expira_en?: string;
  activo?: boolean;
  estudiantes_count?: number;
}

export interface Classroom {
  id: number;
  nombre: string;
  descripcion: string;
  docente: number;
  docente_nombre: string;
  grupos_clases: ClassroomGroup[];
  estudiantes_count: number;
  creado: string;
}

export interface ClassroomStudent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClassroomService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/classrooms`;

  getClassrooms(): Observable<Classroom[]> {
    return this.http.get<Classroom[]>(`${this.apiUrl}/`);
  }

  getClassroom(id: number): Observable<Classroom> {
    return this.http.get<Classroom>(`${this.apiUrl}/${id}/`);
  }

  createClassroom(data: { nombre: string; descripcion?: string }): Observable<Classroom> {
    return this.http.post<Classroom>(`${this.apiUrl}/`, data);
  }

  updateClassroom(id: number, data: { nombre?: string; descripcion?: string }): Observable<Classroom> {
    return this.http.patch<Classroom>(`${this.apiUrl}/${id}/`, data);
  }

  deleteClassroom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }

  getClassroomStudents(id: number): Observable<ClassroomStudent[]> {
    return this.http.get<ClassroomStudent[]>(`${this.apiUrl}/${id}/students/`);
  }
}
