import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { PlayerService } from '../../player/player.service';
import { Icon } from '../../shared/icon';
import { ToastService } from '../../shared/toast.service';
import { PlayerBar } from '../player-bar/player-bar';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

/** App frame: top bar, library on the left, scrollable main view, player bar pinned to the bottom. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Topbar, Sidebar, PlayerBar, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)' },
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly toasts = inject(ToastService);
  private readonly player = inject(PlayerService);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  constructor() {
    // The scroll container is <main>, not window, so reset it ourselves on navigation.
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.main().nativeElement.scrollTo({ top: 0 }));
  }

  /** Space toggles play/pause, unless the user is typing. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.code !== 'Space') return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, button, [contenteditable="true"]')) return;
    event.preventDefault();
    this.player.toggle();
  }
}
