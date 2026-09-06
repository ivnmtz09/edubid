import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GroupStudent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  nombre?: string;
  apellido?: string;
  correo?: string;
}

export interface Group {
  id: number;
  nombre: string;
  descripcion?: string;
  classroom: number;
  classroom_nombre?: string;
  classroom_detail?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  codigo: string;
  activo: boolean;
  codigo_generado_en?: string;
  codigo_expira_en?: string;
  estudiantes_count: number;
  estudiantes_detail?: GroupStudent[];
  creado?: string;
}

export interface JoinGroupResponse {
  mensaje: string;
  grupo: Group;
  wallet_creada: boolean;
  periodo_activo?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/groups`;

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiUrl}/`);
  }

  getGroup(id: number): Observable<Group> {
    return this.http.get<Group>(`${this.apiUrl}/${id}/`);
  }

  createGroup(data: { nombre: string; classroom: number; descripcion?: string }): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/`, data);
  }

  updateGroup(id: number, data: { nombre?: string; descripcion?: string; activo?: boolean }): Observable<Group> {
    return this.http.patch<Group>(`${this.apiUrl}/${id}/`, data);
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }

  joinGroup(code: string): Observable<JoinGroupResponse> {
    return this.http.post<JoinGroupResponse>(`${this.apiUrl}/join/`, { code: code.trim().toUpperCase() });
  }

  getGroupStudents(groupId: number): Observable<GroupStudent[]> {
    return this.http.get<GroupStudent[]>(`${this.apiUrl}/${groupId}/estudiantes/`);
  }
}
