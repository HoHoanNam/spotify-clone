import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { CatalogService } from '../../core/api/catalog.service';
import { LibraryApi } from '../../core/api/library-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryStore } from '../../core/library/library.store';
import { AlbumSummary, PlaylistSummary, Track } from '../../core/models';
import { LOADING, dataOf, errorOf, loadable } from '../../core/util/loadable';
import { ListPlayerService } from '../../player/list-player.service';
import { PlayerService } from '../../player/player.service';
import { greeting } from '../../shared/colors';
import { CoverImage } from '../../shared/cover-image';
import { Icon } from '../../shared/icon';
import { MediaCard } from '../../shared/media-card';
import { PageStatus } from '../../shared/page-status';
import { PlayButton } from '../../shared/play-button';
import { PlaylistCover } from '../../shared/playlist-cover';
import { Shelf } from '../../shared/shelf';
import { TrackList } from '../../shared/track-list';

/** One quick-access tile of the top grid. */
type Tile =
  | { kind: 'liked' }
  | { kind: 'playlist'; playlist: PlaylistSummary }
  | { kind: 'track'; track: Track; index: number };

const TILE_COUNT = 8;

@Component({
  selector: 'app-home',
  imports: [RouterLink, CoverImage, Icon, MediaCard, PageStatus, PlayButton, PlaylistCover, Shelf, TrackList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
})
export class Home {
  protected readonly auth = inject(AuthService);
  protected readonly player = inject(PlayerService);
  protected readonly lists = inject(ListPlayerService);
  protected readonly library = inject(LibraryStore);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);

  protected readonly greeting = greeting();

  private readonly state = toSignal(
    loadable(
      forkJoin({
        recent: inject(LibraryApi)
          .recentlyPlayed(12)
          .pipe(catchError(() => of<Track[]>([]))),
        newest: this.catalog.tracks({ size: 8 }).pipe(map((p) => p.content)),
        popular: this.catalog.tracks({ size: 5, sort: 'playCount,desc' }).pipe(map((p) => p.content)),
        albums: this.catalog.albums({ size: 12 }).pipe(map((p) => p.content)),
        artists: this.catalog.artists({ size: 12 }).pipe(map((p) => p.content)),
        playlists: this.catalog.playlists({ size: 12 }).pipe(map((p) => p.content)),
      }),
    ),
    { initialValue: LOADING },
  );
  protected readonly data = computed(() => dataOf(this.state()));
  protected readonly error = computed(() => errorOf(this.state()));

  /** Tracks the tiles play: what the user listened to, or the newest uploads for a new account. */
  protected readonly tileTracks = computed(() => {
    const data = this.data();
    return data ? (data.recent.length ? data.recent : data.newest) : [];
  });

  /** Liked Songs + own playlists first, then tracks, like Spotify's "recents" grid. */
  protected readonly tiles = computed<Tile[]>(() => {
    const tiles: Tile[] = [];
    if (this.library.likedCount()) tiles.push({ kind: 'liked' });
    this.library
      .playlists()
      .filter((p) => p.trackCount)
      .slice(0, 3)
      .forEach((playlist) => tiles.push({ kind: 'playlist', playlist }));
    this.tileTracks().forEach((track, index) => tiles.push({ kind: 'track', track, index }));
    return tiles.slice(0, TILE_COUNT);
  });

  /** Community playlists, without the user's own (those are in the sidebar already). */
  protected readonly communityPlaylists = computed(() => {
    const me = this.auth.user()?.id;
    return (this.data()?.playlists ?? []).filter((p) => p.owner.id !== me);
  });

  protected readonly isEmpty = computed(() => {
    const d = this.data();
    return !!d && !d.newest.length && !d.albums.length && !d.artists.length;
  });

  protected albumSubtitle(album: AlbumSummary): string {
    const year = album.releaseDate?.slice(0, 4);
    return year ? `${year} • ${album.artist.name}` : album.artist.name;
  }

  protected trackPlaying(track: Track): boolean {
    return this.player.isCurrent(track.id) && this.player.isPlaying();
  }

  protected playTile(tile: Tile): void {
    switch (tile.kind) {
      case 'liked':
        this.router.navigate(['/collection/tracks']);
        return;
      case 'playlist':
        this.lists.toggle('playlist', tile.playlist.id);
        return;
      case 'track':
        if (this.player.isCurrent(tile.track.id)) {
          this.player.toggle();
        } else {
          this.player.playTracks(this.tileTracks(), tile.index, { label: 'Recently played', link: ['/section/recent'] });
        }
    }
  }

  protected openTile(tile: Tile): void {
    if (tile.kind === 'liked') this.router.navigate(['/collection/tracks']);
    else if (tile.kind === 'playlist') this.router.navigate(['/playlist', tile.playlist.id]);
    else this.playTile(tile);
  }

  protected tilePlaying(tile: Tile): boolean {
    if (tile.kind === 'playlist') return this.lists.isPlaying('playlist', tile.playlist.id);
    if (tile.kind === 'track') return this.trackPlaying(tile.track);
    return false;
  }
}
