import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, map, switchMap } from 'rxjs';
import { AdminService } from '../../core/api/admin.service';
import { CatalogService } from '../../core/api/catalog.service';
import { AlbumSummary } from '../../core/models';
import { LOADING, dataOf, errorMessage, errorOf, loadable } from '../../core/util/loadable';
import { CoverImage } from '../../shared/cover-image';
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

  protected readonly form = inject(FormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    artistId: [null as number | null, Validators.required],
    releaseDate: [''],
  });
  protected readonly cover = signal<File | null>(null);
  protected readonly progress = signal<number | null>(null);
  private readonly submitted = signal(false);

  private readonly reload = signal(0);
  private readonly state = toSignal(
    toObservable(this.reload).pipe(
      switchMap(() =>
        loadable(
          forkJoin({
            albums: this.catalog.albums(0, 50).pipe(map((p) => p.content)),
            artists: this.catalog.artists(0, 50).pipe(map((p) => p.content)),
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

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const { title, artistId, releaseDate } = this.form.getRawValue();
    withProgress(
      this.admin.createAlbum({ title: title!.trim(), artistId: artistId!, releaseDate, cover: this.cover() }),
      this.progress,
    ).subscribe({
      next: (album) => {
        this.toast.show(`Created ${album.title}`);
        this.form.reset({ title: '', artistId: artistId, releaseDate: '' });
        this.cover.set(null);
        this.submitted.set(false);
        this.reload.update((n) => n + 1);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  protected remove(album: AlbumSummary): void {
    if (!confirm(`Delete "${album.title}"? Its tracks are kept as singles.`)) return;
    this.admin.delete('albums', album.id).subscribe({
      next: () => {
        this.toast.show(`Deleted ${album.title}`);
        this.reload.update((n) => n + 1);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
