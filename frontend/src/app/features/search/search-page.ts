import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { CatalogService } from '../../core/api/catalog.service';
import { SearchResult } from '../../core/models';
import { Loadable, dataOf, errorOf, loadable } from '../../core/util/loadable';
import { PlayerService } from '../../player/player.service';
import { ArtistLinks } from '../../shared/artist-links';
import { CoverImage } from '../../shared/cover-image';
import { MediaCard } from '../../shared/media-card';
import { PageStatus } from '../../shared/page-status';
import { PlayButton } from '../../shared/play-button';
import { TrackList } from '../../shared/track-list';

/** /search?q=â€¦ â€” the query comes from the search box in the top bar. */
@Component({
  selector: 'app-search-page',
  imports: [RouterLink, ArtistLinks, CoverImage, MediaCard, PageStatus, PlayButton, TrackList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-page.html',
})
export class SearchPage {
  protected readonly player = inject(PlayerService);
  private readonly catalog = inject(CatalogService);

  /** ?q= query param, bound by withComponentInputBinding(). */
  readonly q = input<string>();
  protected readonly term = computed(() => (this.q() ?? '').trim());

  private readonly state = toSignal(
    toObservable(this.term).pipe(
      switchMap((q) => (q ? loadable(this.catalog.search(q)) : of<Loadable<SearchResult>>({ status: 'ok', data: EMPTY }))),
    ),
    { initialValue: { status: 'loading' } as Loadable<SearchResult> },
  );
  protected readonly result = computed(() => dataOf(this.state()));
  protected readonly error = computed(() => errorOf(this.state()));

  /** Spotify shows the best single match first: an artist, else an album, else a song. */
  protected readonly topKind = computed<'artist' | 'album' | 'track' | null>(() => {
    const r = this.result();
    if (r?.artists.length) return 'artist';
    if (r?.albums.length) return 'album';
    if (r?.tracks.length) return 'track';
    return null;
  });
}

const EMPTY: SearchResult = { tracks: [], albums: [], artists: [], playlists: [] };
