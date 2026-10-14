import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { CatalogService } from '../../core/api/catalog.service';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryStore } from '../../core/library/library.store';
import { LOADING, dataOf, errorOf, loadable } from '../../core/util/loadable';
import { ListPlayerService } from '../../player/list-player.service';
import { colorFor } from '../../shared/colors';
import { CoverImage } from '../../shared/cover-image';
import { MediaCard } from '../../shared/media-card';
import { PageStatus } from '../../shared/page-status';

/**
 * /user/:id — public profile: avatar, name, public playlists. On your own profile it also shows the
 * artists you follow (only you can see them) and a link to edit your account.
 */
@Component({
  selector: 'app-profile-page',
  imports: [RouterLink, CoverImage, MediaCard, PageStatus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-page.html',
})
export class ProfilePage {
  protected readonly lists = inject(ListPlayerService);
  protected readonly library = inject(LibraryStore);
  private readonly auth = inject(AuthService);
  private readonly catalog = inject(CatalogService);

  readonly id = input.required<string>();

  /** Re-fetch when the user edits their own account, so name/avatar stay in sync. */
  private readonly state = toSignal(
    toObservable(computed(() => ({ id: +this.id(), me: this.auth.user() }))).pipe(
      switchMap(({ id }) => loadable(this.catalog.user(id))),
    ),
    { initialValue: LOADING },
  );
  protected readonly profile = computed(() => dataOf(this.state()));
  protected readonly error = computed(() => errorOf(this.state()));
  protected readonly isMe = computed(() => +this.id() === this.auth.user()?.id);
  protected readonly color = computed(() => colorFor(+this.id() + 5));

  constructor() {
    const title = inject(Title);
    effect(() => {
      const profile = this.profile();
      if (profile) title.setTitle(`${profile.username} | Spotify Clone`);
    });
  }
}
