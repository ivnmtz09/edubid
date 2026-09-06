import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getUsersList(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/list/`);
  }

  updateUser(userId: number, data: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}/update/`, data);
  }
}
