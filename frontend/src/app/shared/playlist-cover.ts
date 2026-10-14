import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CoverImage } from './cover-image';

/**
 * Playlist artwork like Spotify: the playlist's own cover, else a 2×2 mosaic of the first four track
 * covers, else the first track cover, else a music-note placeholder.
 */
@Component({
  selector: 'app-playlist-cover',
  imports: [CoverImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block overflow-hidden bg-highlight' },
  templateUrl: './playlist-cover.html',
})
export class PlaylistCover {
  readonly images = input<string[]>([]);
  readonly alt = input('');
  readonly iconSize = input(32);
}
