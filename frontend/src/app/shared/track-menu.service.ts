import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LibraryStore } from '../core/library/library.store';
import { Track } from '../core/models';
import { PlayerService } from '../player/player.service';
import { MenuItem } from './menu/context-menu.service';
import { ToastService } from './toast.service';

export interface TrackMenuOptions {
  /** Shown as "Remove from this playlist" when the user owns the playlist being viewed. */
  onRemove?: () => void;
}

/** Builds the Spotify-style "…" / right-click menu for one track or a whole list. */
@Injectable({ providedIn: 'root' })
export class TrackMenuService {
  private readonly library = inject(LibraryStore);
  private readonly player = inject(PlayerService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  forTrack(track: Track, options: TrackMenuOptions = {}): MenuItem[] {
    const liked = this.library.isLiked(track.id);
    const items: MenuItem[] = [
      this.addToPlaylist([track]),
      ...(options.onRemove ? [{ label: 'Remove from this playlist', icon: 'trash', action: options.onRemove } as MenuItem] : []),
      {
        label: liked ? 'Remove from your Liked Songs' : 'Save to your Liked Songs',
        icon: liked ? 'heartFilled' : 'heart',
        action: () => this.library.toggleLike(track),
      },
      { label: 'Add to queue', icon: 'addToQueue', action: () => this.queue([track]) },
    ];

    if (track.artists.length === 1) {
      const artist = track.artists[0];
      items.push({ label: 'Go to artist', icon: 'person', separator: true, action: () => this.go(['/artist', artist.id]) });
    } else {
      items.push({
        label: 'Go to artist',
        icon: 'person',
        separator: true,
        children: track.artists.map((a) => ({ label: a.name, action: () => this.go(['/artist', a.id]) })),
      });
    }
    if (track.album) {
      const album = track.album;
      items.push({ label: 'Go to album', icon: 'album', action: () => this.go(['/album', album.id]) });
    }
    return items;
  }

  /** Menu for a whole album / playlist header. */
  forList(tracks: Track[], extra: MenuItem[] = []): MenuItem[] {
    return [
      { label: 'Add to queue', icon: 'addToQueue', action: () => this.queue(tracks) },
      this.addToPlaylist(tracks),
      ...extra,
    ];
  }

  private addToPlaylist(tracks: Track[]): MenuItem {
    const ids = tracks.map((t) => t.id);
    return {
      label: 'Add to playlist',
      icon: 'plus',
      children: [
        {
          label: 'New playlist',
          icon: 'plus',
          action: () => this.library.addToNewPlaylist(ids).subscribe({ error: () => this.toast.error('Could not create the playlist') }),
        },
        ...this.library.ownPlaylists().map((playlist, i) => ({
          label: playlist.name,
          separator: i === 0,
          action: () => this.library.addToPlaylist(playlist, ids),
        })),
      ],
    };
  }

  private queue(tracks: Track[]): void {
    this.player.addToQueue(tracks);
    this.toast.show(tracks.length === 1 ? 'Added to queue' : `Added ${tracks.length} songs to queue`);
  }

  private go(link: unknown[]): void {
    this.router.navigate(link);
  }
}
