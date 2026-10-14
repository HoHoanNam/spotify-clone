import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LibraryStore } from '../core/library/library.store';
import { Track } from '../core/models';
import { PlayContext, PlayerService } from '../player/player.service';
import { ArtistLinks } from './artist-links';
import { CoverImage } from './cover-image';
import { DurationPipe } from './duration.pipe';
import { Icon } from './icon';
import { LikeButton } from './like-button';
import { ContextMenuService } from './menu/context-menu.service';
import { RelativeTimePipe } from './relative-time.pipe';
import { TrackMenuService } from './track-menu.service';

/** MIME type used when a row is dragged onto a playlist in the sidebar. */
export const TRACK_DRAG_TYPE = 'application/x-spotify-clone-tracks';

export interface TrackMove {
  from: number;
  to: number;
}

/**
 * Spotify-style track table. Like the desktop app: double-click a row (or click the number/play icon)
 * to play the whole list starting from that track; right-click or "…" opens the track menu;
 * rows can be dragged onto a playlist in the sidebar, and reordered when `reorderable` is set.
 */
@Component({
  selector: 'app-track-list',
  imports: [RouterLink, ArtistLinks, CoverImage, DurationPipe, Icon, LikeButton, RelativeTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './track-list.html',
  styleUrl: './track-list.css',
})
export class TrackList {
  protected readonly player = inject(PlayerService);
  protected readonly library = inject(LibraryStore);
  private readonly menus = inject(ContextMenuService);
  private readonly trackMenu = inject(TrackMenuService);

  readonly tracks = input.required<Track[]>();
  readonly showAlbum = input(true);
  readonly showCover = input(true);
  readonly showHeader = input(true);
  /** Album pages show the track number from the album instead of the row index. */
  readonly useTrackNumber = input(false);
  /** "Date added" column (playlists, Liked Songs); same order as `tracks`. */
  readonly addedAt = input<string[] | null>(null);
  /** Shown as "Playing from …" in the queue. */
  readonly context = input<PlayContext | null>(null);
  readonly reorderable = input(false);
  /** Adds "Remove from this playlist" to the menu. */
  readonly removable = input(false);

  readonly moved = output<TrackMove>();
  readonly removed = output<Track>();

  protected readonly dragFrom = signal<number | null>(null);
  protected readonly dropAt = signal<number | null>(null);

  protected readonly columns = computed(() => {
    const cols = ['16px', 'minmax(0,4fr)'];
    if (this.showAlbum()) cols.push('minmax(0,2fr)');
    if (this.addedAt()) cols.push('minmax(0,1fr)');
    cols.push('112px');
    return cols.join(' ');
  });

  protected number(track: Track, index: number): number {
    return this.useTrackNumber() && track.trackNumber ? track.trackNumber : index + 1;
  }

  protected play(index: number): void {
    this.player.playTracks(this.tracks(), index, this.context());
  }

  protected openMenu(event: MouseEvent, track: Track, trigger?: HTMLElement): void {
    const items = this.trackMenu.forTrack(track, {
      onRemove: this.removable() ? () => this.removed.emit(track) : undefined,
    });
    if (trigger) {
      event.stopPropagation();
      this.menus.openFrom(trigger, items);
    } else {
      this.menus.openAt(event, items);
    }
  }

  // ---- Drag and drop

  protected onDragStart(event: DragEvent, track: Track, index: number): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'copyMove';
    event.dataTransfer.setData(TRACK_DRAG_TYPE, JSON.stringify([track.id]));
    event.dataTransfer.setData('text/plain', track.title);
    if (this.reorderable()) this.dragFrom.set(index);
  }

  protected onDragOver(event: DragEvent, index: number): void {
    if (this.dragFrom() === null) return; // a drag from somewhere else
    event.preventDefault();
    this.dropAt.set(index);
  }

  protected onDrop(event: DragEvent, index: number): void {
    const from = this.dragFrom();
    if (from === null) return;
    event.preventDefault();
    if (from !== index) this.moved.emit({ from, to: index });
    this.onDragEnd();
  }

  protected onDragEnd(): void {
    this.dragFrom.set(null);
    this.dropAt.set(null);
  }
}
