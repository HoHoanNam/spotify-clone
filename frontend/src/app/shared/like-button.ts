import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LibraryStore } from '../core/library/library.store';
import { Track } from '../core/models';
import { Icon } from './icon';

/** Heart toggle for Liked Songs. Green and filled when liked; the change shows before the server answers. */
@Component({
  selector: 'app-like-button',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  templateUrl: './like-button.html',
})
export class LikeButton {
  private readonly library = inject(LibraryStore);

  readonly track = input.required<Track>();
  readonly size = input(16);
  protected readonly liked = computed(() => this.library.isLiked(this.track().id));

  protected toggle(event: Event): void {
    event.stopPropagation();
    this.library.toggleLike(this.track());
  }
}
