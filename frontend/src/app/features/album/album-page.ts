import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { CatalogService } from '../../core/api/catalog.service';
import { LOADING, dataOf, errorOf, loadable } from '../../core/util/loadable';
import { PlayerService } from '../../player/player.service';
import { colorFor } from '../../shared/colors';
import { CoverImage } from '../../shared/cover-image';
import { LongDurationPipe } from '../../shared/duration.pipe';
import { PageStatus } from '../../shared/page-status';
import { PlayButton } from '../../shared/play-button';
import { TrackList } from '../../shared/track-list';

@Component({
  selector: 'app-album-page',
  imports: [RouterLink, CoverImage, LongDurationPipe, PageStatus, PlayButton, TrackList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './album-page.html',
})
export class AlbumPage {
  protected readonly player = inject(PlayerService);
  private readonly catalog = inject(CatalogService);

  /** Route param :id, bound by withComponentInputBinding(). */
  readonly id = input.required<string>();

  private readonly state = toSignal(toObservable(this.id).pipe(switchMap((id) => loadable(this.catalog.album(+id)))), {
    initialValue: LOADING,
  });
  protected readonly album = computed(() => dataOf(this.state()));
  protected readonly error = computed(() => errorOf(this.state()));
  protected readonly color = computed(() => colorFor(+this.id()));
  protected readonly totalSeconds = computed(() => (this.album()?.tracks ?? []).reduce((sum, t) => sum + t.durationSec, 0));

  constructor() {
    const title = inject(Title);
    effect(() => {
      const album = this.album();
      if (album) title.setTitle(`${album.title} - Album by ${album.artist.name} | Spotify Clone`);
    });
  }
}
