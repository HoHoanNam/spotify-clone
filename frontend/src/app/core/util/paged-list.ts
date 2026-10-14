import { DestroyRef, inject, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Page } from '../models';
import { errorMessage } from './loadable';

/**
 * Infinite-scroll list: call loadMore() when the sentinel comes into view, reset() when the filter changes.
 * Must be created in an injection context (component field initializer).
 */
export class PagedList<T> {
  private readonly _items = signal<T[]>([]);
  private readonly _loading = signal(false);
  private readonly _done = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _total = signal<number | null>(null);
  private nextPage = 0;
  private request?: Subscription;

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly done = this._done.asReadonly();
  readonly error = this._error.asReadonly();
  readonly total = this._total.asReadonly();

  constructor(private fetch: (page: number) => Observable<Page<T>>) {
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  loadMore(): void {
    if (this._loading() || this._done() || this._error()) return;
    this._loading.set(true);
    this.request = this.fetch(this.nextPage).subscribe({
      next: (page) => {
        this._items.update((items) => [...items, ...page.content]);
        this._total.set(page.totalElements);
        this.nextPage = page.page + 1;
        this._done.set(this.nextPage >= page.totalPages);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set(errorMessage(err));
        this._loading.set(false);
      },
    });
  }

  /** Start over, optionally with a new fetch function (e.g. a new search term). */
  reset(fetch?: (page: number) => Observable<Page<T>>): void {
    this.request?.unsubscribe();
    if (fetch) this.fetch = fetch;
    this.nextPage = 0;
    this._items.set([]);
    this._total.set(null);
    this._done.set(false);
    this._error.set(null);
    this._loading.set(false);
    this.loadMore();
  }

  /** Local edits (e.g. a row removed) without refetching. */
  update(fn: (items: T[]) => T[]): void {
    this._items.update(fn);
  }
}
