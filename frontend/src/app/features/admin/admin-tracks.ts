import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, map, switchMap } from 'rxjs';
import { AdminService } from '../../core/api/admin.service';
import { CatalogService } from '../../core/api/catalog.service';
import { ArtistSummary, Track } from '../../core/models';
import { LOADING, dataOf, errorMessage, errorOf, loadable } from '../../core/util/loadable';
import { PlayerService } from '../../player/player.service';
import { ArtistLinks } from '../../shared/artist-links';
import { CoverImage } from '../../shared/cover-image';
import { DurationPipe } from '../../shared/duration.pipe';
import { Icon } from '../../shared/icon';
import { PageStatus } from '../../shared/page-status';
import { ToastService } from '../../shared/toast.service';
import { FileField } from './file-field';
import { withProgress } from './upload';

@Component({
  selector: 'app-admin-tracks',
  imports: [ReactiveFormsModule, ArtistLinks, CoverImage, DurationPipe, Icon, PageStatus, FileField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-tracks.html',
})
export class AdminTracks {
  protected readonly player = inject(PlayerService);
  private readonly admin = inject(AdminService);
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  protected readonly form = inject(FormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    albumId: [null as number | null],
    trackNumber: [null as number | null, Validators.min(1)],
  });
  protected readonly selectedArtists = signal<ArtistSummary[]>([]);
  protected readonly artistIds = computed(() => this.selectedArtists().map((a) => a.id));
  protected readonly audio = signal<File | null>(null);
  protected readonly cover = signal<File | null>(null);
  protected readonly progress = signal<number | null>(null);
  protected readonly submitted = signal(false);
  /** Track being edited; null means the form creates a new track. */
  protected readonly editing = signal<Track | null>(null);
  protected readonly removeCover = signal(false);
  private readonly formEl = viewChild<ElementRef<HTMLFormElement>>('formEl');

  private readonly reload = signal(0);
  private readonly state = toSignal(
    toObservable(this.reload).pipe(
      switchMap(() =>
        loadable(
          forkJoin({
            tracks: this.catalog.tracks({ size: 50 }).pipe(map((p) => p.content)),
            albums: this.catalog.albums({ size: 50 }).pipe(map((p) => p.content)),
            artists: this.catalog.artists({ size: 50 }).pipe(map((p) => p.content)),
          }),
        ),
      ),
    ),
    { initialValue: LOADING },
  );
  protected readonly data = computed(() => dataOf(this.state()));
  protected readonly error = computed(() => errorOf(this.state()));

  protected invalid(name: 'title'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  protected addArtist(id: string, all: ArtistSummary[]): void {
    const artist = all.find((a) => a.id === Number(id));
    if (artist && !this.artistIds().includes(artist.id)) {
      this.selectedArtists.update((list) => [...list, artist]);
    }
  }

  protected removeArtist(id: number): void {
    this.selectedArtists.update((list) => list.filter((a) => a.id !== id));
  }

  protected startEdit(track: Track): void {
    this.editing.set(track);
    this.form.reset({ title: track.title, albumId: track.album?.id ?? null, trackNumber: track.trackNumber });
    this.selectedArtists.set([...track.artists]);
    this.audio.set(null);
    this.cover.set(null);
    this.removeCover.set(false);
    this.submitted.set(false);
    this.formEl()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected cancelEdit(): void {
    this.editing.set(null);
    this.form.reset({ title: '', albumId: null, trackNumber: null });
    this.selectedArtists.set([]);
    this.audio.set(null);
    this.cover.set(null);
    this.removeCover.set(false);
    this.submitted.set(false);
  }

  protected submit(): void {
    const editing = this.editing();
    if (editing) {
      this.update(editing);
    } else {
      this.create();
    }
  }

  private create(): void {
    this.submitted.set(true);
    const audio = this.audio();
    if (this.form.invalid || !audio || !this.selectedArtists().length) return;
    const { title, albumId, trackNumber } = this.form.getRawValue();
    withProgress(
      this.admin.createTrack({
        title: title!.trim(),
        artistIds: this.artistIds(),
        albumId,
        trackNumber,
        audio,
        cover: this.cover(),
      }),
      this.progress,
    ).subscribe({
      next: (track) => {
        this.toast.show(`Uploaded ${track.title}`);
        // Keep artists and album selected: uploading a whole album is the common case
        this.form.reset({ title: '', albumId, trackNumber: trackNumber ? trackNumber + 1 : null });
        this.audio.set(null);
        this.cover.set(null);
        this.submitted.set(false);
        this.reload.update((n) => n + 1);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  /** Metadata is always sent; audio / cover only when a new file was picked. */
  private update(track: Track): void {
    this.submitted.set(true);
    if (this.form.invalid || !this.selectedArtists().length) return;
    const { title, albumId, trackNumber } = this.form.getRawValue();
    withProgress(
      this.admin.updateTrack(track.id, {
        title: title!.trim(),
        artistIds: this.artistIds(),
        albumId,
        trackNumber,
        audio: this.audio(),
        cover: this.cover(),
        removeCover: this.removeCover(),
      }),
      this.progress,
    ).subscribe({
      next: (updated) => {
        this.toast.show(`Saved ${updated.title}`);
        this.cancelEdit();
        this.reload.update((n) => n + 1);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  protected remove(track: Track): void {
    if (!confirm(`Delete "${track.title}"? The audio file is removed too.`)) return;
    this.admin.delete('tracks', track.id).subscribe({
      next: () => {
        this.toast.show(`Deleted ${track.title}`);
        if (this.editing()?.id === track.id) this.cancelEdit();
        this.reload.update((n) => n + 1);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
