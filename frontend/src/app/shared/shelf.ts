import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** A titled row of cards ("Popular albums   Show all"), like the shelves on Spotify's home page. */
@Component({
  selector: 'app-shelf',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mb-8 block' },
  templateUrl: './shelf.html',
})
export class Shelf {
  readonly heading = input.required<string>();
  /** "Show all" target; hidden when null. */
  readonly showAll = input<unknown[] | string | null>(null);
  /** Lay the cards out in a single row that wraps away (home) instead of a full grid. */
  readonly singleRow = input(false);
}
