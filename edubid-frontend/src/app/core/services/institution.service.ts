import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Institution {
  id: number;
  nombre: string;
  codigo_dane?: string | null;
  activo: boolean;
  color_primario: string;
  color_secundario: string;
  logo?: string | null;
  creado?: string;
  actualizado?: string;
}

export interface InstitutionCreateRequest {
  nombre: string;
  codigo_dane?: string | null;
  activo?: boolean;
  color_primario?: string;
  color_secundario?: string;
  logo?: string | null;
}

export interface InstitutionUpdateRequest {
  nombre?: string;
  codigo_dane?: string | null;
  activo?: boolean;
  color_primario?: string;
  color_secundario?: string;
  logo?: string | null;
}

@Injectable({ providedIn: 'root' })
export class InstitutionService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/institutions/`;

  getInstitutions(): Observable<Institution[]> {
    return this.http.get<Institution[]>(this.baseUrl);
  }

  getInstitution(id: number): Observable<Institution> {
    return this.http.get<Institution>(`${this.baseUrl}${id}/`);
  }

  createInstitution(data: InstitutionCreateRequest): Observable<Institution> {
    return this.http.post<Institution>(this.baseUrl, data);
  }

  updateInstitution(id: number, data: InstitutionUpdateRequest): Observable<Institution> {
    return this.http.patch<Institution>(`${this.baseUrl}${id}/`, data);
  }

  deleteInstitution(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`);
  }
}
