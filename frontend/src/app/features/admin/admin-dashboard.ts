import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminService } from '../../core/api/admin.service';
import { LOADING, dataOf, errorOf, loadable } from '../../core/util/loadable';
import { Icon, IconName } from '../../shared/icon';
import { PageStatus } from '../../shared/page-status';
import { TrackList } from '../../shared/track-list';

const NUMBER = new Intl.NumberFormat('en-US');

/** /admin/dashboard — catalog and usage counters plus the most played tracks. */
@Component({
  selector: 'app-admin-dashboard',
  imports: [Icon, PageStatus, TrackList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard {
  private readonly state = toSignal(loadable(inject(AdminService).stats()), { initialValue: LOADING });
  protected readonly stats = computed(() => dataOf(this.state()));
  protected readonly error = computed(() => errorOf(this.state()));

  protected readonly cards = computed<{ label: string; value: string; icon: IconName }[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Users', value: NUMBER.format(s.users), icon: 'users' },
      { label: 'Tracks', value: NUMBER.format(s.tracks), icon: 'note' },
      { label: 'Albums', value: NUMBER.format(s.albums), icon: 'album' },
      { label: 'Artists', value: NUMBER.format(s.artists), icon: 'person' },
      { label: 'Playlists', value: NUMBER.format(s.playlists), icon: 'queue' },
      { label: 'Total plays', value: NUMBER.format(s.totalPlays), icon: 'chart' },
    ];
  });
}
