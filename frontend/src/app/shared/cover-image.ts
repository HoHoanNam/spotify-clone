import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { Icon, IconName } from './icon';

/** Cover / artist image with a neutral placeholder when there is no image or it fails to load. */
@Component({
  selector: 'app-cover-image',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block overflow-hidden bg-highlight', '[class.rounded-full]': 'round()' },
  templateUrl: './cover-image.html',
})
export class CoverImage {
  readonly src = input<string | null | undefined>(null);
  readonly alt = input('');
  readonly round = input(false);
  readonly placeholder = input<IconName>('note');
  readonly iconSize = input(32);
  /** Resets whenever src changes, so a new image gets a fresh chance to load. */
  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });
}
