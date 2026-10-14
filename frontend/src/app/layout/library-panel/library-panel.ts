import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LibraryStore } from '../../core/library/library.store';
import { PlaylistSummary } from '../../core/models';
import { errorMessage } from '../../core/util/loadable';
import { PlayerService } from '../../player/player.service';
import { CoverImage } from '../../shared/cover-image';
import { Icon, IconName } from '../../shared/icon';
import { PlaylistCover } from '../../shared/playlist-cover';
import { ToastService } from '../../shared/toast.service';
import { TRACK_DRAG_TYPE } from '../../shared/track-list';

type Filter = 'playlists' | 'albums' | 'artists';

/** One row of the library: a playlist, saved album or followed artist. */
interface LibraryEntry {
  key: string;
  kind: Filter;
  title: string;
  subtitle: string;
  link: unknown[];
  images: string[];
  round: boolean;
  placeholder: IconName;
  playlist?: PlaylistSummary;
}

/**
 * "Your Library" list, used by the sidebar and the mobile /collection page.
 * Filter chips + text filter, Liked Songs pinned on top, and playlists accept tracks dropped from any list.
 */
@Component({
  selector: 'app-library-panel',
  imports: [RouterLink, RouterLinkActive, CoverImage, Icon, PlaylistCover],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './library-panel.html',
})
export class LibraryPanel {
  protected readonly library = inject(LibraryStore);
  private readonly player = inject(PlayerService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly filter = signal<Filter | null>(null);
  protected readonly query = signal('');
  protected readonly searching = signal(false);
  protected readonly dropTarget = signal<string | null>(null);
  protected readonly chips: { value: Filter; label: string }[] = [
    { value: 'playlists', label: 'Playlists' },
    { value: 'albums', label: 'Albums' },
    { value: 'artists', label: 'Artists' },
  ];

  private readonly entries = computed<LibraryEntry[]>(() => [
    ...this.library.playlists().map(
      (p): LibraryEntry => ({
        key: `playlist-${p.id}`,
        kind: 'playlists',
        title: p.name,
        subtitle: `Playlist • ${p.owner.username}`,
        link: ['/playlist', p.id],
        images: p.images,
        round: false,
        placeholder: 'note',
        playlist: p,
      }),
    ),
    ...this.library.albums().map(
      (a): LibraryEntry => ({
        key: `album-${a.id}`,
        kind: 'albums',
        title: a.title,
        subtitle: `Album • ${a.artist.name}`,
        link: ['/album', a.id],
        images: a.coverUrl ? [a.coverUrl] : [],
        round: false,
        placeholder: 'album',
      }),
    ),
    ...this.library.artists().map(
      (a): LibraryEntry => ({
        key: `artist-${a.id}`,
        kind: 'artists',
        title: a.name,
        subtitle: 'Artist',
        link: ['/artist', a.id],
        images: a.imageUrl ? [a.imageUrl] : [],
        round: true,
        placeholder: 'person',
      }),
    ),
  ]);

  protected readonly visible = computed(() => {
    const filter = this.filter();
    const q = this.query().trim().toLowerCase();
    return this.entries().filter(
      (e) => (!filter || e.kind === filter) && (!q || e.title.toLowerCase().includes(q)),
    );
  });

  protected readonly showLiked = computed(() => {
    const filter = this.filter();
    const q = this.query().trim().toLowerCase();
    return (!filter || filter === 'playlists') && (!q || 'liked songs'.includes(q));
  });

  protected toggleFilter(value: Filter): void {
    this.filter.update((current) => (current === value ? null : value));
  }

  protected toggleSearch(): void {
    this.searching.update((open) => !open);
    if (!this.searching()) this.query.set('');
  }

  protected createPlaylist(): void {
    this.library.createPlaylist().subscribe({
      next: (playlist) => this.router.navigate(['/playlist', playlist.id]),
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  /** Speaker icon on the row whose list is playing. */
  protected isPlayingFrom(link: unknown[]): boolean {
    const context = this.player.context()?.link;
    return !!context && this.player.isPlaying() && context.join('/') === link.join('/');
  }

  // ---- Dropping tracks from a track list

  protected onDragOver(event: DragEvent, key: string): void {
    if (!event.dataTransfer?.types.includes(TRACK_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    this.dropTarget.set(key);
  }

  protected onDrop(event: DragEvent, playlist: PlaylistSummary | null): void {
    const ids = readTrackIds(event);
    this.dropTarget.set(null);
    if (!ids) return;
    event.preventDefault();
    if (playlist) {
      this.library.addToPlaylist(playlist, ids);
    } else {
      this.library.likeAll(ids);
    }
  }
}

function readTrackIds(event: DragEvent): number[] | null {
  try {
    const raw = event.dataTransfer?.getData(TRACK_DRAG_TYPE);
    const ids = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(ids) && ids.every((id) => typeof id === 'number') ? ids : null;
  } catch {
    return null;
  }
}
