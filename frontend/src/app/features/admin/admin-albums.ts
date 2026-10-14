import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, forkJoin, map, switchMap } from 'rxjs';
import { AdminService } from '../../core/api/admin.service';
import { CatalogService } from '../../core/api/catalog.service';
import { AlbumSummary } from '../../core/models';
import { LOADING, dataOf, errorMessage, errorOf, loadable } from '../../core/util/loadable';
import { CoverImage } from '../../shared/cover-image';
import { ConfirmService } from '../../shared/dialog/confirm.service';
import { Icon } from '../../shared/icon';
import { PageStatus } from '../../shared/page-status';
import { ToastService } from '../../shared/toast.service';
import { FileField } from './file-field';
import { withProgress } from './upload';

@Component({
  selector: 'app-admin-albums',
  imports: [ReactiveFormsModule, RouterLink, CoverImage, Icon, PageStatus, FileField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-albums.html',
})
export class AdminAlbums {
  private readonly admin = inject(AdminService);
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);
  private readonly confirms = inject(ConfirmService);

  protected readonly form = inject(FormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    artistId: [null as number | null, Validators.required],
    releaseDate: [''],
  });
  protected readonly cover = signal<File | null>(null);
  protected readonly removeCover = signal(false);
  protected readonly progress = signal<number | null>(null);
  private readonly submitted = signal(false);
  /** Album being edited; null means the form creates a new album. */
  protected readonly editing = signal<AlbumSummary | null>(null);
  private readonly formEl = viewChild<ElementRef<HTMLFormElement>>('formEl');

  private readonly reload = signal(0);
  protected readonly filterInput = new FormControl('', { nonNullable: true });
  private readonly filter = toSignal(this.filterInput.valueChanges.pipe(debounceTime(300), map((q) => q.trim())), {
    initialValue: '',
  });
  private readonly state = toSignal(
    toObservable(computed(() => ({ n: this.reload(), q: this.filter() }))).pipe(
      switchMap(({ q }) =>
        loadable(
          forkJoin({
            albums: this.catalog.albums({ q, size: 50 }).pipe(map((p) => p.content)),
            artists: this.catalog.artists({ size: 50, sort: 'name' }).pipe(map((p) => p.content)),
          }),
        ),
      ),
    ),
    { initialValue: LOADING },
  );
  protected readonly data = computed(() => dataOf(this.state()));
  protected readonly error = computed(() => errorOf(this.state()));

  protected invalid(name: 'title' | 'artistId'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  protected startEdit(album: AlbumSummary): void {
    this.editing.set(album);
    this.form.reset({ title: album.title, artistId: album.artist.id, releaseDate: album.releaseDate ?? '' });
    this.cover.set(null);
    this.removeCover.set(false);
    this.submitted.set(false);
    this.formEl()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected cancelEdit(): void {
    const artistId = this.form.controls.artistId.value;
    this.editing.set(null);
    this.form.reset({ title: '', artistId, releaseDate: '' });
    this.cover.set(null);
    this.removeCover.set(false);
    this.submitted.set(false);
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const { title, artistId, releaseDate } = this.form.getRawValue();
    const body = { title: title!.trim(), artistId: artistId!, releaseDate, cover: this.cover() };
    const editing = this.editing();
    const request = editing
      ? this.admin.updateAlbum(editing.id, { ...body, removeCover: this.removeCover() })
      : this.admin.createAlbum(body);
    withProgress(request, this.progress).subscribe({
      next: (album) => {
        this.toast.show(editing ? `Saved ${album.title}` : `Created ${album.title}`);
        this.cancelEdit();
        this.reload.update((n) => n + 1);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  protected async remove(album: AlbumSummary): Promise<void> {
    const ok = await this.confirms.confirm({
      title: 'Delete album?',
      message: `"${album.title}" will be deleted. Its tracks are kept as singles.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.admin.delete('albums', album.id).subscribe({
      next: () => {
        this.toast.show(`Deleted ${album.title}`);
        if (this.editing()?.id === album.id) this.cancelEdit();
        this.reload.update((n) => n + 1);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
