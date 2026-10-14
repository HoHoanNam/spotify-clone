import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Loading spinner or error message for a page body. */
@Component({
  selector: 'app-page-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-status.html',
})
export class PageStatus {
  readonly error = input<string | null>(null);
}
