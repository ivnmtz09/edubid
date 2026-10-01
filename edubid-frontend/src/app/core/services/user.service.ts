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

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile/`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/profile/update/`, data);
  }

  changePassword(data: { old_password: string; new_password: string; confirm_password?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/change-password/`, data);
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/password-reset/`, { email });
  }

  confirmPasswordReset(uidb64: string, token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/password-reset-confirm/${uidb64}/${token}/`, {
      new_password: newPassword
    });
  }

  deleteAccount(password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/delete-account/`, { password });
  }
}
