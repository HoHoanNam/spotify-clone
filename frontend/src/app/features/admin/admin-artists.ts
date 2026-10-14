import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { AdminService } from '../../core/api/admin.service';
import { CatalogService } from '../../core/api/catalog.service';
import { ArtistSummary } from '../../core/models';
import { LOADING, dataOf, errorMessage, errorOf, loadable } from '../../core/util/loadable';
import { CoverImage } from '../../shared/cover-image';
import { Icon } from '../../shared/icon';
import { PageStatus } from '../../shared/page-status';
import { ToastService } from '../../shared/toast.service';
import { FileField } from './file-field';
import { withProgress } from './upload';

@Component({
  selector: 'app-admin-artists',
  imports: [ReactiveFormsModule, RouterLink, CoverImage, Icon, PageStatus, FileField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-artists.html',
})
export class AdminArtists {
  private readonly admin = inject(AdminService);
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    bio: [''],
  });
  protected readonly image = signal<File | null>(null);
  protected readonly progress = signal<number | null>(null);
  private readonly submitted = signal(false);

  private readonly reload = signal(0);
  private readonly state = toSignal(
    toObservable(this.reload).pipe(switchMap(() => loadable(this.catalog.artists({ size: 50 }).pipe(map((p) => p.content))))),
    { initialValue: LOADING },
  );
  protected readonly artists = computed(() => dataOf(this.state()));
  protected readonly error = computed(() => errorOf(this.state()));

  protected invalid(name: 'name'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const { name, bio } = this.form.getRawValue();
    withProgress(this.admin.createArtist({ name: name.trim(), bio, image: this.image() }), this.progress).subscribe({
      next: (artist) => {
        this.toast.show(`Created ${artist.name}`);
        this.form.reset();
        this.image.set(null);
        this.submitted.set(false);
        this.reload.update((n) => n + 1);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  protected remove(artist: ArtistSummary): void {
    if (!confirm(`Delete "${artist.name}"? Artists that still have albums or tracks cannot be deleted.`)) return;
    this.admin.delete('artists', artist.id).subscribe({
      next: () => {
        this.toast.show(`Deleted ${artist.name}`);
        this.reload.update((n) => n + 1);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
