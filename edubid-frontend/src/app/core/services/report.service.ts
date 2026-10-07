import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserReportPayload {
  tipo: string;
  asunto: string;
  descripcion: string;
  email_contacto?: string;
  nombre_contacto?: string;
  pagina_origen?: string;
  navegador_info?: string;
}

export interface UserReportResponse {
  success: boolean;
  message: string;
  id?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports/`;

  sendReport(report: UserReportPayload): Observable<UserReportResponse> {
    return this.http.post<UserReportResponse>(this.apiUrl, report);
  }
}
