import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon';

/**
 * "Your Library" panel. Playlists and Liked Songs arrive with the Playlist/Like backend (roadmap step 4);
 * until then it shows Spotify's empty-state prompts.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
})
export class Sidebar {}
