import { Injectable, signal } from '@angular/core';
import { IconName } from '../icon';

export interface MenuItem {
  label: string;
  icon?: IconName;
  action?: () => void;
  /** Opens a submenu on hover (e.g. "Add to playlist ▸"). */
  children?: MenuItem[];
  danger?: boolean;
  /** Draws a divider above this item. */
  separator?: boolean;
}

export interface OpenMenu {
  items: MenuItem[];
  x: number;
  y: number;
}

/**
 * One context menu for the whole app (rendered by the shell). Opened by right-clicking a row or
 * pressing a "…" button; closes on outside click, Escape, scroll or navigation.
 */
@Injectable({ providedIn: 'root' })
export class ContextMenuService {
  private readonly _menu = signal<OpenMenu | null>(null);
  readonly menu = this._menu.asReadonly();

  /** Right click: open at the pointer. */
  openAt(event: MouseEvent, items: MenuItem[]): void {
    event.preventDefault();
    event.stopPropagation();
    this._menu.set({ items, x: event.clientX, y: event.clientY });
  }

  /** "…" button: open under the button, aligned to its right edge. */
  openFrom(trigger: HTMLElement, items: MenuItem[]): void {
    const rect = trigger.getBoundingClientRect();
    this._menu.set({ items, x: rect.right, y: rect.bottom + 4 });
  }

  close(): void {
    this._menu.set(null);
  }
}
