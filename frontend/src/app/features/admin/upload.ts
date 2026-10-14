import { HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { WritableSignal } from '@angular/core';
import { Observable, filter, finalize, map, tap } from 'rxjs';

/** Feeds upload progress (0–100) into a signal and emits the response body once done. */
export function withProgress<T>(events: Observable<HttpEvent<T>>, progress: WritableSignal<number | null>): Observable<T> {
  progress.set(0);
  return events.pipe(
    tap((event) => {
      if (event.type === HttpEventType.UploadProgress && event.total) {
        progress.set(Math.round((100 * event.loaded) / event.total));
      }
    }),
    filter((event): event is HttpResponse<T> => event.type === HttpEventType.Response),
    map((response) => response.body as T),
    finalize(() => progress.set(null)),
  );
}
