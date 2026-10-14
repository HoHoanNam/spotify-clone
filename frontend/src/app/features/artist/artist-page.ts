import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { switchMap } from 'rxjs';
import { CatalogService } from '../../core/api/catalog.service';
import { LibraryStore } from '../../core/library/library.store';
import { AlbumSummary, ArtistDetail } from '../../core/models';
import { LOADING, dataOf, errorOf, loadable } from '../../core/util/loadable';
import { ListPlayerService } from '../../player/list-player.service';
import { PlayContext, PlayerService } from '../../player/player.service';
import { colorFor } from '../../shared/colors';
import { Icon } from '../../shared/icon';
import { MediaCard } from '../../shared/media-card';
import { ContextMenuService } from '../../shared/menu/context-menu.service';
import { PageStatus } from '../../shared/page-status';
import { PlayButton } from '../../shared/play-button';
import { TrackList } from '../../shared/track-list';
import { TrackMenuService } from '../../shared/track-menu.service';

const COMPACT = new Intl.NumberFormat('en-US');

@Component({
  selector: 'app-artist-page',
  imports: [Icon, MediaCard, PageStatus, PlayButton, TrackList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './artist-page.html',
})
export class ArtistPage {
  protected readonly player = inject(PlayerService);
  protected readonly library = inject(LibraryStore);
  protected readonly lists = inject(ListPlayerService);
  private readonly catalog = inject(CatalogService);
  private readonly menus = inject(ContextMenuService);
  private readonly trackMenu = inject(TrackMenuService);

  readonly id = input.required<string>();

  private readonly state = toSignal(toObservable(this.id).pipe(switchMap((id) => loadable(this.catalog.artist(+id)))), {
    initialValue: LOADING,
  });
  protected readonly artist = computed(() => dataOf(this.state()));
  protected readonly error = computed(() => errorOf(this.state()));
  protected readonly color = computed(() => colorFor(+this.id()));
  /** Collapses again when navigating to another artist. */
  protected readonly showAll = linkedSignal({ source: this.id, computation: () => false });
  protected readonly visibleTracks = computed(() => {
    const tracks = this.artist()?.topTracks ?? [];
    return this.showAll() ? tracks : tracks.slice(0, 5);
  });
  protected readonly context = computed<PlayContext | null>(() => {
    const artist = this.artist();
    return artist ? { label: artist.name, link: ['/artist', artist.id] } : null;
  });
  /** The follower count from the server, adjusted locally right after Follow / Unfollow. */
  protected readonly followers = computed(() => {
    const artist = this.artist();
    if (!artist) return 0;
    return artist.followers + (this.library.isFollowing(artist.id) ? 1 : 0) - (this.followedAtLoad() ? 1 : 0);
  });
  /** Whether the server count already includes the user: re-read when the artist or the library (re)loads. */
  private readonly followedAtLoad = linkedSignal({
    source: computed(() => ({ artist: this.artist(), loaded: this.library.loaded() })),
    computation: ({ artist }) => (artist ? untracked(() => this.library.isFollowing(artist.id)) : false),
  });

  constructor() {
    const title = inject(Title);
    effect(() => {
      const artist = this.artist();
      if (artist) title.setTitle(`${artist.name} | Spotify Clone`);
    });
  }

  protected formatCount(n: number): string {
    return COMPACT.format(n);
  }

  protected albumSubtitle(album: AlbumSummary): string {
    return album.releaseDate ? `${album.releaseDate.slice(0, 4)} • Album` : 'Album';
  }

  protected openMenu(trigger: HTMLElement, artist: ArtistDetail): void {
    const following = this.library.isFollowing(artist.id);
    this.menus.openFrom(
      trigger,
      this.trackMenu.forList(artist.topTracks, [
        {
          label: following ? 'Unfollow' : 'Follow',
          icon: following ? 'close' : 'person',
          action: () => this.library.toggleFollow(artist),
        },
      ]),
    );
  }
}
