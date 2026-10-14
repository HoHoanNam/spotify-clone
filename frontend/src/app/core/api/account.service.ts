import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { User } from '../models';
import { toFormData } from '../util/form-data';

/** The current user's own account. Every change refreshes AuthService.user so the top bar updates. */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly api = `${environment.apiUrl}/me`;

  rename(username: string): Observable<User> {
    return this.http.patch<User>(this.api, { username }).pipe(tap((user) => this.auth.setUser(user)));
  }

  uploadAvatar(avatar: File): Observable<User> {
    return this.http
      .put<User>(`${this.api}/avatar`, toFormData({ avatar }))
      .pipe(tap((user) => this.auth.setUser(user)));
  }

  removeAvatar(): Observable<User> {
    return this.http.delete<User>(`${this.api}/avatar`).pipe(tap((user) => this.auth.setUser(user)));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.api}/password`, { currentPassword, newPassword });
  }
}
