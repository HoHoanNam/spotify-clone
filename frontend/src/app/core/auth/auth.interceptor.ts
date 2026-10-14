import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Adds the Bearer token to API calls; a 401 on a protected call means the session is over. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const isApi = req.url.startsWith(environment.apiUrl);
  const isAuthCall = req.url.startsWith(`${environment.apiUrl}/auth/`);

  const request = token && isApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      // isLoggedIn() is false during startup (/api/me), where AuthService.init() handles the failure itself.
      if (err instanceof HttpErrorResponse && err.status === 401 && isApi && !isAuthCall && auth.isLoggedIn()) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
