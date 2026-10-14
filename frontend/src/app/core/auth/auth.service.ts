import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models';

const TOKEN_KEY = 'spotify-clone.token';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  username: string;
}

/**
 * Holds the JWT and the current user. The token lives in localStorage so a reload keeps the session;
 * the user is re-fetched from /api/me on startup so role/enabled changes are picked up.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = environment.apiUrl;

  private readonly _token = signal<string | null>(readToken());
  private readonly _user = signal<User | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  /** Called once at startup (provideAppInitializer). Never rejects: a bad token just means "logged out". */
  init(): Promise<unknown> {
    if (!this._token()) return Promise.resolve();
    return firstValueFrom(
      this.http.get<User>(`${this.api}/me`).pipe(
        tap((user) => this._user.set(user)),
        catchError(() => {
          this.clear();
          return of(null);
        }),
      ),
    );
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, req).pipe(tap((res) => this.store(res)));
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/register`, req).pipe(tap((res) => this.store(res)));
  }

  logout(): void {
    this.clear();
    this.router.navigate(['/login']);
  }

  private store(res: AuthResponse): void {
    try {
      localStorage.setItem(TOKEN_KEY, res.accessToken);
    } catch {
      // storage blocked (private mode): the session still works until reload
    }
    this._token.set(res.accessToken);
    this._user.set(res.user);
  }

  private clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    this._token.set(null);
    this._user.set(null);
  }
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
