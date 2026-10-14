import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from './icon';

/** The round green play/pause button used on cards and page headers. */
@Component({
  selector: 'app-play-button',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  templateUrl: './play-button.html',
})
export class PlayButton {
  readonly playing = input(false);
  readonly size = input(48);
  readonly label = input('Play');
  readonly pressed = output<void>();
}
