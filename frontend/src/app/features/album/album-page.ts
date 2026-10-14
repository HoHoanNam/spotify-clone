import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { CatalogService } from '../../core/api/catalog.service';
import { LibraryStore } from '../../core/library/library.store';
import { AlbumDetail, AlbumSummary } from '../../core/models';
import { LOADING, dataOf, errorOf, loadable } from '../../core/util/loadable';
import { ListPlayerService } from '../../player/list-player.service';
import { PlayContext, PlayerService } from '../../player/player.service';
import { colorFor } from '../../shared/colors';
import { CoverImage } from '../../shared/cover-image';
import { LongDurationPipe } from '../../shared/duration.pipe';
import { Icon } from '../../shared/icon';
import { MediaCard } from '../../shared/media-card';
import { ContextMenuService } from '../../shared/menu/context-menu.service';
import { PageStatus } from '../../shared/page-status';
import { PlayButton } from '../../shared/play-button';
import { Shelf } from '../../shared/shelf';
import { TrackList } from '../../shared/track-list';
import { TrackMenuService } from '../../shared/track-menu.service';

const RELEASE_DATE = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

@Component({
  selector: 'app-album-page',
  imports: [RouterLink, CoverImage, Icon, LongDurationPipe, MediaCard, PageStatus, PlayButton, Shelf, TrackList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './album-page.html',
})
export class AlbumPage {
  protected readonly player = inject(PlayerService);
  protected readonly library = inject(LibraryStore);
  protected readonly lists = inject(ListPlayerService);
  private readonly catalog = inject(CatalogService);
  private readonly menus = inject(ContextMenuService);
  private readonly trackMenu = inject(TrackMenuService);
  private readonly router = inject(Router);

  /** Route param :id, bound by withComponentInputBinding(). */
  readonly id = input.required<string>();

  private readonly state = toSignal(toObservable(this.id).pipe(switchMap((id) => loadable(this.catalog.album(+id)))), {
    initialValue: LOADING,
  });
  protected readonly album = computed(() => dataOf(this.state()));
  protected readonly error = computed(() => errorOf(this.state()));
  protected readonly color = computed(() => colorFor(+this.id()));
  protected readonly totalSeconds = computed(() => (this.album()?.tracks ?? []).reduce((sum, t) => sum + t.durationSec, 0));
  protected readonly context = computed<PlayContext | null>(() => {
    const album = this.album();
    return album ? { label: album.title, link: ['/album', album.id] } : null;
  });
  protected readonly releaseDate = computed(() => {
    const date = this.album()?.releaseDate;
    return date ? RELEASE_DATE.format(new Date(date)) : null;
  });

  /** "More by <artist>": the artist's other albums, loaded after the album itself. */
  private readonly moreState = toSignal(
    toObservable(computed(() => this.album()?.artist.id ?? null)).pipe(
      switchMap((artistId) =>
        artistId === null
          ? of<AlbumSummary[]>([])
          : this.catalog.artist(artistId).pipe(
              map((a) => a.albums),
              catchError(() => of<AlbumSummary[]>([])),
            ),
      ),
    ),
    { initialValue: [] },
  );
  protected readonly moreByArtist = computed(() => this.moreState().filter((a) => a.id !== this.album()?.id));

  constructor() {
    const title = inject(Title);
    effect(() => {
      const album = this.album();
      if (album) title.setTitle(`${album.title} - Album by ${album.artist.name} | Spotify Clone`);
    });
  }

  protected openMenu(trigger: HTMLElement, album: AlbumDetail): void {
    const saved = this.library.isSaved(album.id);
    this.menus.openFrom(
      trigger,
      this.trackMenu.forList(album.tracks, [
        {
          label: saved ? 'Remove from Your Library' : 'Save to Your Library',
          icon: saved ? 'checkCircle' : 'addCircle',
          action: () => this.library.toggleSaveAlbum(album),
        },
        {
          label: 'Go to artist',
          icon: 'person',
          separator: true,
          action: () => this.router.navigate(['/artist', album.artist.id]),
        },
      ]),
    );
  }

  protected albumYear(album: AlbumSummary): string {
    return album.releaseDate ? `${album.releaseDate.slice(0, 4)} • Album` : 'Album';
  }
}
