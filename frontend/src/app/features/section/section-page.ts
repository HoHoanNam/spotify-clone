import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Observable, map } from 'rxjs';
import { CatalogService } from '../../core/api/catalog.service';
import { LibraryApi } from '../../core/api/library-api.service';
import { AlbumSummary, ArtistSummary, Page, PlaylistSummary, Track } from '../../core/models';
import { PagedList } from '../../core/util/paged-list';
import { ListPlayerService } from '../../player/list-player.service';
import { PlayContext } from '../../player/player.service';
import { InfiniteScroll } from '../../shared/infinite-scroll';
import { MediaCard } from '../../shared/media-card';
import { PageStatus } from '../../shared/page-status';
import { TrackList } from '../../shared/track-list';

type Kind = 'tracks' | 'popular' | 'recent' | 'albums' | 'artists' | 'playlists';
type Item = Track | AlbumSummary | ArtistSummary | PlaylistSummary;

const SECTIONS: Record<Kind, { title: string; shape: 'tracks' | 'albums' | 'artists' | 'playlists' }> = {
  tracks: { title: 'All songs', shape: 'tracks' },
  popular: { title: 'Popular songs', shape: 'tracks' },
  recent: { title: 'Recently played', shape: 'tracks' },
  albums: { title: 'New releases', shape: 'albums' },
  artists: { title: 'Artists', shape: 'artists' },
  playlists: { title: 'Playlists from the community', shape: 'playlists' },
};

const PAGE_SIZE = 40;

/** "Show all" pages behind the home shelves: /section/albums, /section/popular... with infinite scroll. */
@Component({
  selector: 'app-section-page',
  imports: [InfiniteScroll, MediaCard, PageStatus, TrackList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section-page.html',
})
export class SectionPage {
  protected readonly lists = inject(ListPlayerService);
  private readonly catalog = inject(CatalogService);
  private readonly libraryApi = inject(LibraryApi);

  /** Route param :kind. */
  readonly kind = input.required<string>();
  protected readonly section = computed(() => SECTIONS[this.kind() as Kind] ?? null);

  protected readonly list = new PagedList<Item>((page) => this.fetch(this.kind() as Kind, page));
  protected readonly tracks = computed(() => this.list.items() as Track[]);
  protected readonly albums = computed(() => this.list.items() as AlbumSummary[]);
  protected readonly artists = computed(() => this.list.items() as ArtistSummary[]);
  protected readonly playlists = computed(() => this.list.items() as PlaylistSummary[]);
  protected readonly context = computed<PlayContext | null>(() => {
    const section = this.section();
    return section ? { label: section.title, link: ['/section', this.kind()] } : null;
  });

  constructor() {
    const title = inject(Title);
    effect(() => {
      const section = this.section();
      untracked(() => {
        if (!section) return;
        title.setTitle(`${section.title} | Spotify Clone`);
        this.list.reset();
      });
    });
  }

  private fetch(kind: Kind, page: number): Observable<Page<Item>> {
    const query = { page, size: PAGE_SIZE };
    switch (kind) {
      case 'tracks':
        return this.catalog.tracks(query);
      case 'popular':
        return this.catalog.tracks({ ...query, sort: 'playCount,desc' });
      case 'recent':
        // Not paged on the server: one page of the 50 most recent
        return this.libraryApi
          .recentlyPlayed(50)
          .pipe(map((content) => ({ content, page: 0, size: content.length, totalElements: content.length, totalPages: 1 })));
      case 'albums':
        return this.catalog.albums(query);
      case 'artists':
        return this.catalog.artists(query);
      case 'playlists':
        return this.catalog.playlists(query);
    }
  }

  protected albumSubtitle(album: AlbumSummary): string {
    const year = album.releaseDate?.slice(0, 4);
    return year ? `${year} • ${album.artist.name}` : album.artist.name;
  }
}
