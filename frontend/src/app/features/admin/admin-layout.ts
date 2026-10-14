import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** /admin — tabs styled like Spotify's filter chips. */
@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  protected readonly tabs = [
    { path: 'tracks', label: 'Tracks' },
    { path: 'albums', label: 'Albums' },
    { path: 'artists', label: 'Artists' },
  ];
}
