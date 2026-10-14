import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  kind: 'info' | 'error';
}

/** Small bottom-center notifications ("Track uploaded", errors...). Rendered by the shell. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, kind: Toast['kind'] = 'info', durationMs = 3500): void {
    const toast: Toast = { id: ++this.nextId, message, kind };
    this._toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), durationMs);
  }

  error(message: string): void {
    this.show(message, 'error', 5000);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
