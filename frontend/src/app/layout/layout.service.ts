import { Injectable, signal } from '@angular/core';

/** UI state of the shell that several components toggle (player bar button, keyboard shortcuts...). */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly queueOpen = signal(false);
  readonly shortcutsOpen = signal(false);

  toggleQueue(): void {
    this.queueOpen.update((open) => !open);
  }
}
