import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LibraryApi } from '../../core/api/library-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryStore } from '../../core/library/library.store';
import { TrackItem } from '../../core/models';
import { PagedList } from '../../core/util/paged-list';
import { PlayContext, PlayerService } from '../../player/player.service';
import { Icon } from '../../shared/icon';
import { InfiniteScroll } from '../../shared/infinite-scroll';
import { PageStatus } from '../../shared/page-status';
import { PlayButton } from '../../shared/play-button';
import { TrackList } from '../../shared/track-list';

/**
 * /collection/tracks — newest likes first, loaded page by page while scrolling.
 * Un-liking a song (heart, menu or "L") removes its row right away: the list is filtered by LibraryStore.
 */
@Component({
  selector: 'app-liked-songs',
  imports: [RouterLink, Icon, InfiniteScroll, PageStatus, PlayButton, TrackList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './liked-songs.html',
})
export class LikedSongs {
  protected readonly player = inject(PlayerService);
  protected readonly auth = inject(AuthService);
  protected readonly library = inject(LibraryStore);
  private readonly api = inject(LibraryApi);

  protected readonly list = new PagedList<TrackItem>((page) => this.api.likedTracks(page));
  protected readonly items = computed(() => this.list.items().filter((i) => this.library.isLiked(i.track.id)));
  protected readonly tracks = computed(() => this.items().map((i) => i.track));
  protected readonly addedAt = computed(() => this.items().map((i) => i.addedAt));
  protected readonly context: PlayContext = { label: 'Liked Songs', link: ['/collection/tracks'] };

  constructor() {
    this.list.loadMore();
  }
}
