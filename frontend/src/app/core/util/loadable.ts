import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, startWith } from 'rxjs';
import { ProblemDetail } from '../models';

export type Loadable<T> =
  | { status: 'loading' }
  | { status: 'ok'; data: T }
  | { status: 'error'; error: string };

export const LOADING: Loadable<never> = { status: 'loading' };

/** Wraps a request so a template can switch on loading / ok / error without try/catch. */
export function loadable<T>(source: Observable<T>): Observable<Loadable<T>> {
  return source.pipe(
    map((data): Loadable<T> => ({ status: 'ok', data })),
    catchError((err) => of<Loadable<T>>({ status: 'error', error: errorMessage(err) })),
    startWith<Loadable<T>>(LOADING),
  );
}

export function dataOf<T>(state: Loadable<T>): T | null {
  return state.status === 'ok' ? state.data : null;
}

export function errorOf(state: Loadable<unknown>): string | null {
  return state.status === 'error' ? state.error : null;
}

/** Human-readable message from an HTTP error (Problem Details `detail` when available). */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const problem = err.error as Partial<ProblemDetail> | null;
    if (problem?.errors) {
      return Object.entries(problem.errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(' · ');
    }
    if (problem?.detail) return problem.detail;
    if (err.status === 0) return 'Cannot reach the server. Is the backend running?';
    return `Request failed (${err.status})`;
  }
  return 'Something went wrong';
}
