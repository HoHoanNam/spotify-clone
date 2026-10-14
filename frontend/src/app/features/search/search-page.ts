import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { CatalogService } from '../../core/api/catalog.service';
import { AlbumSummary, ArtistSummary, Page, PlaylistSummary, SearchResult, Track } from '../../core/models';
import { Loadable, dataOf, errorOf, loadable } from '../../core/util/loadable';
import { PagedList } from '../../core/util/paged-list';
import { ListPlayerService } from '../../player/list-player.service';
import { PlayerService } from '../../player/player.service';
import { ArtistLinks } from '../../shared/artist-links';
import { CoverImage } from '../../shared/cover-image';
import { Icon } from '../../shared/icon';
import { InfiniteScroll } from '../../shared/infinite-scroll';
import { MediaCard } from '../../shared/media-card';
import { PageStatus } from '../../shared/page-status';
import { PlayButton } from '../../shared/play-button';
import { TrackList } from '../../shared/track-list';
import { RecentItem, RecentSearches } from './recent-searches.service';

export type SearchType = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';
type Item = Track | AlbumSummary | ArtistSummary | PlaylistSummary;

const PAGE_SIZE = 30;

/**
 * /search?q=…&type=… — the query comes from the search box in the top bar; the chips switch between
 * the "All" overview and one kind with infinite scroll. Without a query: recent searches + browse tiles.
 */
@Component({
  selector: 'app-search-page',
  imports: [RouterLink, ArtistLinks, CoverImage, Icon, InfiniteScroll, MediaCard, PageStatus, PlayButton, TrackList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-page.html',
})
export class SearchPage {
  protected readonly player = inject(PlayerService);
  protected readonly lists = inject(ListPlayerService);
  protected readonly recent = inject(RecentSearches);
  private readonly catalog = inject(CatalogService);

  /** ?q= and ?type= query params, bound by withComponentInputBinding(). */
  readonly q = input<string>();
  readonly type = input<string>();
  protected readonly term = computed(() => (this.q() ?? '').trim());
  protected readonly tab = computed<SearchType>(() => {
    const t = this.type();
    return t === 'songs' || t === 'artists' || t === 'albums' || t === 'playlists' ? t : 'all';
  });

  protected readonly tabs: { value: SearchType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'songs', label: 'Songs' },
    { value: 'artists', label: 'Artists' },
    { value: 'albums', label: 'Albums' },
    { value: 'playlists', label: 'Playlists' },
  ];

  protected readonly browse = [
    { label: 'New releases', link: '/section/albums', color: '#e8115b' },
    { label: 'Popular songs', link: '/section/popular', color: '#148a08' },
    { label: 'Artists', link: '/section/artists', color: '#8d67ab' },
    { label: 'Community playlists', link: '/section/playlists', color: '#1e3264' },
    { label: 'All songs', link: '/section/tracks', color: '#ba5d07' },
    { label: 'Recently played', link: '/section/recent', color: '#509bf5' },
  ];

  // ---- "All" tab: one request with the top 10 of each kind

  private readonly overviewState = toSignal(
    toObservable(computed(() => (this.tab() === 'all' ? this.term() : ''))).pipe(
      switchMap((q) => (q ? loadable(this.catalog.search(q)) : of<Loadable<SearchResult>>({ status: 'ok', data: EMPTY }))),
    ),
    { initialValue: { status: 'loading' } as Loadable<SearchResult> },
  );
  protected readonly result = computed(() => dataOf(this.overviewState()));
  protected readonly error = computed(() => errorOf(this.overviewState()));

  /** Spotify shows the best single match first: an artist, else an album, else a song. */
  protected readonly topKind = computed<'artist' | 'album' | 'track' | null>(() => {
    const r = this.result();
    if (r?.artists.length) return 'artist';
    if (r?.albums.length) return 'album';
    if (r?.tracks.length) return 'track';
    return null;
  });

  // ---- One-kind tabs: paged with infinite scroll

  protected readonly paged = new PagedList<Item>(() => of(EMPTY_PAGE));
  protected readonly pagedTracks = computed(() => this.paged.items() as Track[]);
  protected readonly pagedAlbums = computed(() => this.paged.items() as AlbumSummary[]);
  protected readonly pagedArtists = computed(() => this.paged.items() as ArtistSummary[]);
  protected readonly pagedPlaylists = computed(() => this.paged.items() as PlaylistSummary[]);

  constructor() {
    effect(() => {
      const tab = this.tab();
      const q = this.term();
      untracked(() => {
        if (tab !== 'all' && q) this.paged.reset((page) => this.fetch(tab, q, page));
      });
    });
  }

  private fetch(tab: Exclude<SearchType, 'all'>, q: string, page: number): Observable<Page<Item>> {
    const query = { q, page, size: PAGE_SIZE };
    switch (tab) {
      case 'songs':
        return this.catalog.tracks(query);
      case 'albums':
        return this.catalog.albums(query);
      case 'artists':
        return this.catalog.artists(query);
      case 'playlists':
        return this.catalog.playlists(query);
    }
  }

  // ---- Recent searches

  protected rememberTrack(track: Track): void {
    this.recent.remember({
      kind: 'track',
      id: track.id,
      title: track.title,
      subtitle: `Song • ${track.artists.map((a) => a.name).join(', ')}`,
      imageUrl: track.coverUrl,
      link: track.album ? ['/album', track.album.id] : ['/artist', track.artists[0].id],
    });
  }

  protected rememberAlbum(album: AlbumSummary): void {
    this.recent.remember({
      kind: 'album',
      id: album.id,
      title: album.title,
      subtitle: `Album • ${album.artist.name}`,
      imageUrl: album.coverUrl,
      link: ['/album', album.id],
    });
  }

  protected rememberArtist(artist: ArtistSummary): void {
    this.recent.remember({
      kind: 'artist',
      id: artist.id,
      title: artist.name,
      subtitle: 'Artist',
      imageUrl: artist.imageUrl,
      link: ['/artist', artist.id],
    });
  }

  protected rememberPlaylist(playlist: PlaylistSummary): void {
    this.recent.remember({
      kind: 'playlist',
      id: playlist.id,
      title: playlist.name,
      subtitle: `Playlist • ${playlist.owner.username}`,
      imageUrl: playlist.images[0] ?? null,
      link: ['/playlist', playlist.id],
    });
  }

  protected removeRecent(event: Event, item: RecentItem): void {
    event.preventDefault();
    event.stopPropagation();
    this.recent.remove(item);
  }

  protected playTop(tracks: Track[]): void {
    this.rememberTrack(tracks[0]);
    this.player.playTracks(tracks, 0, { label: `Search: ${this.term()}` });
  }
}

const EMPTY: SearchResult = { tracks: [], albums: [], artists: [], playlists: [] };
const EMPTY_PAGE: Page<never> = { content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 };
