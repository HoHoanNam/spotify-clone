import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { combineLatest, debounceTime, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { CatalogService } from '../../core/api/catalog.service';
import { PlaylistService } from '../../core/api/playlist.service';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryStore } from '../../core/library/library.store';
import { PlaylistDetail, PlaylistSummary, Track, TrackItem } from '../../core/models';
import { LOADING, dataOf, errorMessage, errorOf, loadable } from '../../core/util/loadable';
import { PlayContext, PlayerService } from '../../player/player.service';
import { ArtistLinks } from '../../shared/artist-links';
import { colorFor } from '../../shared/colors';
import { CoverImage } from '../../shared/cover-image';
import { ConfirmService } from '../../shared/dialog/confirm.service';
import { LongDurationPipe } from '../../shared/duration.pipe';
import { Icon } from '../../shared/icon';
import { MenuItem, ContextMenuService } from '../../shared/menu/context-menu.service';
import { PageStatus } from '../../shared/page-status';
import { PlayButton } from '../../shared/play-button';
import { PlaylistCover } from '../../shared/playlist-cover';
import { ToastService } from '../../shared/toast.service';
import { TrackList, TrackMove } from '../../shared/track-list';
import { TrackMenuService } from '../../shared/track-menu.service';
import { PlaylistEditDialog } from './playlist-edit-dialog';

/**
 * /playlist/:id. The owner can edit details, reorder by drag and drop, remove tracks and search for
 * tracks to add at the bottom ("Let's find something for your playlist"). Others get a read-only view.
 * Changes are applied locally first and rolled back (reloaded) if the server rejects them.
 */
@Component({
  selector: 'app-playlist-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ArtistLinks,
    CoverImage,
    Icon,
    LongDurationPipe,
    PageStatus,
    PlayButton,
    PlaylistCover,
    PlaylistEditDialog,
    TrackList,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './playlist-page.html',
})
export class PlaylistPage {
  protected readonly player = inject(PlayerService);
  private readonly api = inject(PlaylistService);
  private readonly catalog = inject(CatalogService);
  private readonly auth = inject(AuthService);
  private readonly library = inject(LibraryStore);
  private readonly menus = inject(ContextMenuService);
  private readonly trackMenu = inject(TrackMenuService);
  private readonly confirms = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  private readonly reload = signal(0);
  private readonly state = toSignal(
    combineLatest([toObservable(this.id), toObservable(this.reload)]).pipe(
      switchMap(([id]) => loadable(this.api.get(+id))),
    ),
    { initialValue: LOADING },
  );
  protected readonly playlist = computed(() => dataOf(this.state()));
  protected readonly error = computed(() => errorOf(this.state()));

  /** Local copy of the rows so reorder / remove show instantly. */
  protected readonly items = linkedSignal<TrackItem[]>(() => this.playlist()?.items ?? []);
  protected readonly tracks = computed(() => this.items().map((i) => i.track));
  protected readonly addedAt = computed(() => this.items().map((i) => i.addedAt));
  protected readonly totalSeconds = computed(() => this.tracks().reduce((sum, t) => sum + t.durationSec, 0));

  protected readonly isOwner = computed(() => this.playlist()?.owner.id === this.auth.user()?.id);
  protected readonly color = computed(() => colorFor(+this.id() + 3));
  protected readonly context = computed<PlayContext | null>(() => {
    const p = this.playlist();
    return p ? { label: p.name, link: ['/playlist', p.id] } : null;
  });
  protected readonly editing = signal(false);

  // ---- "Let's find something for your playlist"
  protected readonly finder = new FormControl('', { nonNullable: true });
  protected readonly finderOpen = linkedSignal({ source: this.playlist, computation: (p) => !!p && !p.items.length });
  private readonly finderResults = toSignal(
    this.finder.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map((q) => q.trim()),
      distinctUntilChanged(),
      switchMap((q) => (q ? this.catalog.tracks({ q, size: 10 }).pipe(map((p) => p.content)) : of<Track[]>([]))),
    ),
    { initialValue: [] as Track[] },
  );
  protected readonly suggestions = computed(() => {
    const inPlaylist = new Set(this.tracks().map((t) => t.id));
    return this.finderResults().filter((t) => !inPlaylist.has(t.id));
  });

  constructor() {
    const title = inject(Title);
    effect(() => {
      const p = this.playlist();
      if (p) title.setTitle(`${p.name} - playlist by ${p.owner.username} | Spotify Clone`);
    });
  }

  protected visibility(p: PlaylistDetail): string {
    return p.isPublic ? 'Public Playlist' : 'Private Playlist';
  }

  protected openMenu(trigger: HTMLElement, p: PlaylistDetail): void {
    const ownerItems: MenuItem[] = this.isOwner()
      ? [
          { label: 'Edit details', icon: 'edit', separator: true, action: () => this.editing.set(true) },
          {
            label: p.isPublic ? 'Make private' : 'Make public',
            icon: p.isPublic ? 'lock' : 'globe',
            action: () => this.setPublic(p, !p.isPublic),
          },
          { label: 'Delete', icon: 'trash', danger: true, action: () => this.delete(p) },
        ]
      : [];
    this.menus.openFrom(trigger, this.trackMenu.forList(this.tracks(), ownerItems));
  }

  protected onSaved(summary: PlaylistSummary): void {
    this.editing.set(false);
    this.library.upsertPlaylist(summary);
    this.reload.update((n) => n + 1);
  }

  protected onMoved({ from, to }: TrackMove, p: PlaylistDetail): void {
    this.items.update((items) => {
      const next = [...items];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
    this.api.moveTrack(p.id, from, to).subscribe({
      next: () => this.library.refreshPlaylists(), // the mosaic follows the first four tracks
      error: (err) => this.fail(err),
    });
  }

  protected onRemoved(track: Track, p: PlaylistDetail): void {
    this.items.update((items) => items.filter((i) => i.track.id !== track.id));
    this.api.removeTrack(p.id, track.id).subscribe({
      next: () => {
        this.toast.show(`Removed from ${p.name}`);
        this.library.refreshPlaylists();
      },
      error: (err) => this.fail(err),
    });
  }

  protected add(track: Track, p: PlaylistDetail): void {
    this.api.addTracks(p.id, [track.id]).subscribe({
      next: ({ playlist }) => {
        this.items.update((items) => [...items, { track, addedAt: new Date().toISOString() }]);
        this.library.upsertPlaylist(playlist);
        this.toast.show(`Added to ${playlist.name}`);
      },
      error: (err) => this.fail(err),
    });
  }

  private setPublic(p: PlaylistDetail, isPublic: boolean): void {
    this.api.update(p.id, { name: p.name, description: p.description, isPublic }).subscribe({
      next: (summary) => {
        this.toast.show(isPublic ? 'Playlist is now public' : 'Playlist is now private');
        this.onSaved(summary);
      },
      error: (err) => this.fail(err),
    });
  }

  private async delete(p: PlaylistDetail): Promise<void> {
    const ok = await this.confirms.confirm({
      title: 'Delete from Your Library?',
      message: `This will delete ${p.name} from Your Library.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.delete(p.id).subscribe({
      next: () => {
        this.library.removePlaylist(p.id);
        this.toast.show('Removed from Your Library');
        this.router.navigate(['/']);
      },
      error: (err) => this.fail(err),
    });
  }

  private fail(err: unknown): void {
    this.toast.error(errorMessage(err));
    this.reload.update((n) => n + 1);
  }
}
