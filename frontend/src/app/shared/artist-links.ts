import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArtistSummary } from '../core/models';

/** "Artist A, Artist B" with each name linking to the artist page. */
@Component({
  selector: 'app-artist-links',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './artist-links.html',
})
export class ArtistLinks {
  readonly artists = input.required<ArtistSummary[]>();
}
