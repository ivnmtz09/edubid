import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  active_classrooms: number;
  total_educoins: number;
  grade_metrics: {
    grade: string;
    participationRate: number;
    totalCoins: number;
    activeClassrooms: number;
  }[];
  recent_audits: {
    id: number | string;
    timestamp: string;
    action: string;
    classroom: string;
    teacher: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users/dashboard-stats/`;

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.apiUrl);
  }
}
