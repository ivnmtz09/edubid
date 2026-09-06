import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InstitutionUpdateRequest {
  nombre?: string;
  logo?: string;
  color_primario?: string;
  color_secundario?: string;
}

@Injectable({ providedIn: 'root' })
export class InstitutionService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/institutions/`;

  updateInstitution(id: number, data: InstitutionUpdateRequest): Observable<any> {
    return this.http.patch(`${this.baseUrl}${id}/`, data);
  }
}
