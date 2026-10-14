import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Track } from '../core/models';
import { PlayerService } from '../player/player.service';
import { ArtistLinks } from './artist-links';
import { CoverImage } from './cover-image';
import { DurationPipe } from './duration.pipe';
import { Icon } from './icon';

/**
 * Spotify-style track table. Like the desktop app: double-click a row (or click the number/play icon)
 * to play the whole list starting from that track.
 */
@Component({
  selector: 'app-track-list',
  imports: [RouterLink, ArtistLinks, CoverImage, DurationPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './track-list.html',
  styleUrl: './track-list.css',
})
export class TrackList {
  protected readonly player = inject(PlayerService);

  readonly tracks = input.required<Track[]>();
  readonly showAlbum = input(true);
  readonly showCover = input(true);
  readonly showHeader = input(true);
  /** Album pages show the track number from the album instead of the row index. */
  readonly useTrackNumber = input(false);

  protected columns(): string {
    return this.showAlbum() ? '16px minmax(0,4fr) minmax(0,2fr) 72px' : '16px minmax(0,1fr) 72px';
  }

  protected number(track: Track, index: number): number {
    return this.useTrackNumber() && track.trackNumber ? track.trackNumber : index + 1;
  }

  protected play(index: number): void {
    this.player.playTracks(this.tracks(), index);
  }
}
