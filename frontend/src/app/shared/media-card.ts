import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoverImage } from './cover-image';
import { IconName } from './icon';
import { PlayButton } from './play-button';
import { PlaylistCover } from './playlist-cover';

/** Album / artist / playlist card: hover lifts the background and slides in the green play button. */
@Component({
  selector: 'app-media-card',
  imports: [RouterLink, CoverImage, PlayButton, PlaylistCover],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './media-card.html',
})
export class MediaCard {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly imageUrl = input<string | null>(null);
  /** Playlist artwork (mosaic); used instead of imageUrl when set. */
  readonly images = input<string[] | null>(null);
  readonly link = input.required<unknown[]>();
  readonly round = input(false);
  readonly placeholder = input<IconName>('album');
  readonly playable = input(true);
  readonly playing = input(false);
  readonly play = output<void>();
}
