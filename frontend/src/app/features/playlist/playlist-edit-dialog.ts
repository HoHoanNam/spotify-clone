import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlaylistService } from '../../core/api/playlist.service';
import { PlaylistDetail, PlaylistSummary } from '../../core/models';
import { errorMessage } from '../../core/util/loadable';
import { Modal } from '../../shared/dialog/modal';
import { Icon } from '../../shared/icon';
import { PlaylistCover } from '../../shared/playlist-cover';

/** Spotify's "Edit details" dialog: photo, name, description, visibility. */
@Component({
  selector: 'app-playlist-edit-dialog',
  imports: [ReactiveFormsModule, Icon, Modal, PlaylistCover],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './playlist-edit-dialog.html',
})
export class PlaylistEditDialog implements OnInit {
  private readonly api = inject(PlaylistService);

  readonly playlist = input.required<PlaylistDetail>();
  readonly closed = output<void>();
  readonly saved = output<PlaylistSummary>();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(300)],
    isPublic: [true],
  });
  protected readonly cover = signal<File | null>(null);
  protected readonly removeCover = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Object URL of the picked file, for the preview. */
  private readonly preview = signal<string | null>(null);

  /** What the photo box shows: the picked file, the track mosaic (cover removed), or the current artwork. */
  protected readonly images = computed(() => {
    const preview = this.preview();
    if (preview) return [preview];
    const playlist = this.playlist();
    if (!this.removeCover() || !playlist.hasCover) return playlist.images;
    const covers = playlist.items.map((i) => i.track.coverUrl).filter((url): url is string => !!url);
    return [...new Set(covers)].slice(0, 4);
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.setPreview(null));
  }

  ngOnInit(): void {
    const p = this.playlist();
    this.form.reset({ name: p.name, description: p.description ?? '', isPublic: p.isPublic });
  }

  protected pick(input: HTMLInputElement): void {
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;
    this.cover.set(file);
    this.setPreview(URL.createObjectURL(file));
    this.removeCover.set(false);
  }

  protected dropCover(): void {
    this.cover.set(null);
    this.setPreview(null);
    this.removeCover.set(true);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, description, isPublic } = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.api
      .update(this.playlist().id, {
        name: name.trim(),
        description: description.trim(),
        isPublic,
        cover: this.cover(),
        removeCover: this.removeCover(),
      })
      .subscribe({
        next: (summary) => this.saved.emit(summary),
        error: (err) => {
          this.error.set(errorMessage(err));
          this.saving.set(false);
        },
      });
  }

  private setPreview(url: string | null): void {
    const old = this.preview();
    if (old) URL.revokeObjectURL(old);
    this.preview.set(url);
  }
}
