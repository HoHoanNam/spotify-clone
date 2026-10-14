import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CatalogService } from '../core/api/catalog.service';
import { PlaylistService } from '../core/api/playlist.service';
import { Track } from '../core/models';
import { errorMessage } from '../core/util/loadable';
import { ToastService } from '../shared/toast.service';
import { PlayContext, PlayerService } from './player.service';

export type ListKind = 'album' | 'artist' | 'playlist';

/**
 * Play buttons on cards (Home, Search, library): the card only knows an id, so the tracks are fetched
 * on the first click. A second click on the card that is playing pauses instead of refetching.
 */
@Injectable({ providedIn: 'root' })
export class ListPlayerService {
  private readonly player = inject(PlayerService);
  private readonly catalog = inject(CatalogService);
  private readonly playlists = inject(PlaylistService);
  private readonly toast = inject(ToastService);

  static link(kind: ListKind, id: number): unknown[] {
    return [`/${kind}`, id];
  }

  /** Is this album / artist / playlist the list currently playing? */
  isPlaying(kind: ListKind, id: number): boolean {
    return this.player.isPlaying() && this.isContext(ListPlayerService.link(kind, id));
  }

  isContext(link: unknown[]): boolean {
    const context = this.player.context()?.link;
    return !!context && context.join('/') === link.join('/');
  }

  toggle(kind: ListKind, id: number): void {
    if (this.isContext(ListPlayerService.link(kind, id)) && this.player.current()) {
      this.player.toggle();
      return;
    }
    this.load(kind, id).subscribe({
      next: ({ tracks, context }) => {
        if (tracks.length) {
          this.player.playTracks(tracks, 0, context);
        } else {
          this.toast.show('Nothing to play yet');
        }
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  private load(kind: ListKind, id: number): Observable<{ tracks: Track[]; context: PlayContext }> {
    const link = ListPlayerService.link(kind, id);
    switch (kind) {
      case 'album':
        return this.catalog.album(id).pipe(map((a) => ({ tracks: a.tracks, context: { label: a.title, link } })));
      case 'artist':
        return this.catalog.artist(id).pipe(map((a) => ({ tracks: a.topTracks, context: { label: a.name, link } })));
      case 'playlist':
        return this.playlists
          .get(id)
          .pipe(map((p) => ({ tracks: p.items.map((i) => i.track), context: { label: p.name, link } })));
    }
  }
}
