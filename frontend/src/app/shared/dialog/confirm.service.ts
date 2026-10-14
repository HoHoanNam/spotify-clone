import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  /** Red confirm button for destructive actions. */
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

/** Promise-based replacement for window.confirm, styled like Spotify's dialogs. Rendered by the shell. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _pending = signal<PendingConfirm | null>(null);
  readonly pending = this._pending.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    this._pending()?.resolve(false);
    return new Promise((resolve) => this._pending.set({ ...options, resolve }));
  }

  answer(ok: boolean): void {
    this._pending()?.resolve(ok);
    this._pending.set(null);
  }
}
