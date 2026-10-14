import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { switchMap } from 'rxjs';
import { CatalogService } from '../../core/api/catalog.service';
import { AlbumSummary } from '../../core/models';
import { LOADING, dataOf, errorOf, loadable } from '../../core/util/loadable';
import { PlayerService } from '../../player/player.service';
import { colorFor } from '../../shared/colors';
import { MediaCard } from '../../shared/media-card';
import { PageStatus } from '../../shared/page-status';
import { PlayButton } from '../../shared/play-button';
import { TrackList } from '../../shared/track-list';

@Component({
  selector: 'app-artist-page',
  imports: [MediaCard, PageStatus, PlayButton, TrackList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './artist-page.html',
})
export class ArtistPage {
  protected readonly player = inject(PlayerService);
  private readonly catalog = inject(CatalogService);

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

  constructor() {
    const title = inject(Title);
    effect(() => {
      const artist = this.artist();
      if (artist) title.setTitle(`${artist.name} | Spotify Clone`);
    });
  }

  protected albumSubtitle(album: AlbumSummary): string {
    return album.releaseDate ? `${album.releaseDate.slice(0, 4)} • Album` : 'Album';
  }
}
