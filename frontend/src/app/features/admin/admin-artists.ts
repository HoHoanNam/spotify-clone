import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, map, switchMap } from 'rxjs';
import { AdminService } from '../../core/api/admin.service';
import { CatalogService } from '../../core/api/catalog.service';
import { ArtistSummary } from '../../core/models';
import { LOADING, dataOf, errorMessage, errorOf, loadable } from '../../core/util/loadable';
import { CoverImage } from '../../shared/cover-image';
import { ConfirmService } from '../../shared/dialog/confirm.service';
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
  private readonly confirms = inject(ConfirmService);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    bio: [''],
  });
  protected readonly image = signal<File | null>(null);
  protected readonly removeImage = signal(false);
  protected readonly progress = signal<number | null>(null);
  private readonly submitted = signal(false);
  /** Artist being edited; null means the form creates a new artist. */
  protected readonly editing = signal<ArtistSummary | null>(null);
  private readonly formEl = viewChild<ElementRef<HTMLFormElement>>('formEl');

  private readonly reload = signal(0);
  protected readonly filterInput = new FormControl('', { nonNullable: true });
  private readonly filter = toSignal(this.filterInput.valueChanges.pipe(debounceTime(300), map((q) => q.trim())), {
    initialValue: '',
  });
  private readonly state = toSignal(
    toObservable(computed(() => ({ n: this.reload(), q: this.filter() }))).pipe(
      switchMap(({ q }) => loadable(this.catalog.artists({ q, size: 50, sort: 'name' }).pipe(map((p) => p.content)))),
    ),
    { initialValue: LOADING },
  );
  protected readonly artists = computed(() => dataOf(this.state()));
  protected readonly error = computed(() => errorOf(this.state()));

  protected invalid(name: 'name'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  /** The list only has name + image, so the bio comes from the artist page. */
  protected startEdit(artist: ArtistSummary): void {
    this.editing.set(artist);
    this.form.reset({ name: artist.name, bio: '' });
    this.image.set(null);
    this.removeImage.set(false);
    this.submitted.set(false);
    this.catalog.artist(artist.id).subscribe({
      next: (detail) => {
        if (this.editing()?.id === artist.id) this.form.controls.bio.setValue(detail.bio ?? '');
      },
    });
    this.formEl()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected cancelEdit(): void {
    this.editing.set(null);
    this.form.reset();
    this.image.set(null);
    this.removeImage.set(false);
    this.submitted.set(false);
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const { name, bio } = this.form.getRawValue();
    const body = { name: name.trim(), bio, image: this.image() };
    const editing = this.editing();
    const request = editing
      ? this.admin.updateArtist(editing.id, { ...body, removeImage: this.removeImage() })
      : this.admin.createArtist(body);
    withProgress(request, this.progress).subscribe({
      next: (artist) => {
        this.toast.show(editing ? `Saved ${artist.name}` : `Created ${artist.name}`);
        this.cancelEdit();
        this.reload.update((n) => n + 1);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  protected async remove(artist: ArtistSummary): Promise<void> {
    const ok = await this.confirms.confirm({
      title: 'Delete artist?',
      message: `"${artist.name}" will be deleted. Artists that still have albums or tracks cannot be deleted.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.admin.delete('artists', artist.id).subscribe({
      next: () => {
        this.toast.show(`Deleted ${artist.name}`);
        if (this.editing()?.id === artist.id) this.cancelEdit();
        this.reload.update((n) => n + 1);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
