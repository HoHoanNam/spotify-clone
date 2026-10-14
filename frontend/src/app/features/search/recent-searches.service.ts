import { Injectable, signal } from '@angular/core';

/** An item the user opened from search results, shown under "Recent searches" like Spotify. */
export interface RecentItem {
  kind: 'track' | 'album' | 'artist' | 'playlist';
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  link: unknown[];
}

const KEY = 'spotify-clone.recent-searches';
const MAX = 10;

/** Per-browser history (localStorage); a convenience, so it silently does nothing when storage is blocked. */
@Injectable({ providedIn: 'root' })
export class RecentSearches {
  private readonly _items = signal<RecentItem[]>(read());
  readonly items = this._items.asReadonly();

  remember(item: RecentItem): void {
    this.write([item, ...this._items().filter((i) => !(i.kind === item.kind && i.id === item.id))].slice(0, MAX));
  }

  remove(item: RecentItem): void {
    this.write(this._items().filter((i) => i !== item));
  }

  clear(): void {
    this.write([]);
  }

  private write(items: RecentItem[]): void {
    this._items.set(items);
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }
}

function read(): RecentItem[] {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}
