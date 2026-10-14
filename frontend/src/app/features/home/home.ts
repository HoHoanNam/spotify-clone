import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { CatalogService } from '../../core/api/catalog.service';
import { AuthService } from '../../core/auth/auth.service';
import { AlbumSummary, Track } from '../../core/models';
import { LOADING, dataOf, errorOf, loadable } from '../../core/util/loadable';
import { PlayerService } from '../../player/player.service';
import { greeting } from '../../shared/colors';
import { CoverImage } from '../../shared/cover-image';
import { MediaCard } from '../../shared/media-card';
import { PageStatus } from '../../shared/page-status';
import { PlayButton } from '../../shared/play-button';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CoverImage, MediaCard, PageStatus, PlayButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
})
export class Home {
  protected readonly auth = inject(AuthService);
  protected readonly player = inject(PlayerService);
  private readonly catalog = inject(CatalogService);

  protected readonly greeting = greeting();

  private readonly state = toSignal(
    loadable(
      forkJoin({
        tracks: this.catalog.tracks(0, 8).pipe(map((p) => p.content)),
        albums: this.catalog.albums(0, 12).pipe(map((p) => p.content)),
        artists: this.catalog.artists(0, 12).pipe(map((p) => p.content)),
      }),
    ),
    { initialValue: LOADING },
  );
  protected readonly data = computed(() => dataOf(this.state()));
  protected readonly error = computed(() => errorOf(this.state()));

  protected subtitle(album: AlbumSummary): string {
    const year = album.releaseDate?.slice(0, 4);
    return year ? `${year} • ${album.artist.name}` : album.artist.name;
  }

  protected playTile(tracks: Track[], index: number): void {
    if (this.player.isCurrent(tracks[index].id)) {
      this.player.toggle();
    } else {
      this.player.playTracks(tracks, index);
    }
  }
}
