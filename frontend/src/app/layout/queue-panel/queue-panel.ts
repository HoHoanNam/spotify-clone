import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../player/player.service';
import { ArtistLinks } from '../../shared/artist-links';
import { CoverImage } from '../../shared/cover-image';
import { Icon } from '../../shared/icon';
import { LayoutService } from '../layout.service';

/** Right-hand "Queue" panel: now playing · next in queue (manual) · next from the current context. */
@Component({
  selector: 'app-queue-panel',
  imports: [NgTemplateOutlet, RouterLink, ArtistLinks, CoverImage, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './queue-panel.html',
})
export class QueuePanel {
  protected readonly player = inject(PlayerService);
  protected readonly layout = inject(LayoutService);
}
