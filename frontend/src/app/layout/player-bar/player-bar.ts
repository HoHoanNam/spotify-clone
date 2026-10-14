import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../player/player.service';
import { ArtistLinks } from '../../shared/artist-links';
import { CoverImage } from '../../shared/cover-image';
import { DurationPipe } from '../../shared/duration.pipe';
import { Icon, IconName } from '../../shared/icon';

/** Bottom "Now playing" bar: track info · transport controls + progress · volume. */
@Component({
  selector: 'app-player-bar',
  imports: [RouterLink, ArtistLinks, CoverImage, DurationPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './player-bar.html',
  styleUrl: './player-bar.css',
})
export class PlayerBar {
  protected readonly player = inject(PlayerService);

  /** While the user drags the progress bar, show the drag position instead of the live time. */
  protected readonly dragTime = signal<number | null>(null);
  protected readonly shownTime = computed(() => this.dragTime() ?? this.player.currentTime());
  protected readonly fillPercent = computed(() => {
    const duration = this.player.duration();
    return duration ? (this.shownTime() / duration) * 100 : 0;
  });

  protected readonly volumeIcon = computed<IconName>(() => {
    const volume = this.player.muted() ? 0 : this.player.volume();
    if (volume === 0) return 'volumeOff';
    return volume < 0.5 ? 'volumeLow' : 'volumeHigh';
  });

  protected commitSeek(seconds: number): void {
    this.player.seek(seconds);
    this.dragTime.set(null);
  }
}
