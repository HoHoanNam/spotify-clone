import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { AdminService } from '../../core/api/admin.service';
import { AuthService } from '../../core/auth/auth.service';
import { AdminUser, Role } from '../../core/models';
import { errorMessage } from '../../core/util/loadable';
import { PagedList } from '../../core/util/paged-list';
import { CoverImage } from '../../shared/cover-image';
import { ConfirmService } from '../../shared/dialog/confirm.service';
import { PageStatus } from '../../shared/page-status';
import { ToastService } from '../../shared/toast.service';

const JOINED = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * /admin/users — search accounts, change role, disable / enable. The backend refuses changes to your own
 * account, so the UI disables those controls too. A disabled user is locked out on their next request.
 */
@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule, CoverImage, PageStatus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-users.html',
})
export class AdminUsers {
  protected readonly auth = inject(AuthService);
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly confirms = inject(ConfirmService);

  protected readonly search = new FormControl('', { nonNullable: true });
  private query = '';
  protected readonly users = new PagedList<AdminUser>((page) => this.admin.users(page, this.query));

  constructor() {
    this.users.loadMore();
    this.search.valueChanges
      .pipe(
        debounceTime(300),
        map((q) => q.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((q) => {
        this.query = q;
        this.users.reset();
      });
  }

  protected joined(user: AdminUser): string {
    return JOINED.format(new Date(user.createdAt));
  }

  protected setRole(user: AdminUser, role: Role): void {
    this.update(user, { role }, `${user.username} is now ${role === 'ADMIN' ? 'an admin' : 'a user'}`);
  }

  protected async toggleEnabled(user: AdminUser): Promise<void> {
    if (user.enabled) {
      const ok = await this.confirms.confirm({
        title: 'Disable account?',
        message: `${user.username} will be logged out and cannot log in until the account is enabled again.`,
        confirmLabel: 'Disable',
        danger: true,
      });
      if (!ok) return;
    }
    this.update(user, { enabled: !user.enabled }, user.enabled ? `Disabled ${user.username}` : `Enabled ${user.username}`);
  }

  private update(user: AdminUser, change: { role?: Role; enabled?: boolean }, message: string): void {
    this.admin.updateUser(user.id, change).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        this.toast.show(message);
      },
      error: (err) => {
        this.toast.error(errorMessage(err));
        this.users.update((list) => [...list]); // re-render the select with the old value
      },
    });
  }
}
