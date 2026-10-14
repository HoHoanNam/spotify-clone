import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryStore } from '../../core/library/library.store';
import { PlayerService } from '../../player/player.service';
import { ConfirmDialog } from '../../shared/dialog/confirm-dialog';
import { Icon } from '../../shared/icon';
import { ContextMenu } from '../../shared/menu/context-menu';
import { ContextMenuService } from '../../shared/menu/context-menu.service';
import { ToastService } from '../../shared/toast.service';
import { LayoutService } from '../layout.service';
import { PlayerBar } from '../player-bar/player-bar';
import { QueuePanel } from '../queue-panel/queue-panel';
import { ShortcutsDialog } from '../shortcuts-dialog/shortcuts-dialog';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

const VOLUME_STEP = 0.1;
const SEEK_STEP_SEC = 5;

/**
 * App frame: top bar, library on the left, scrollable main view, optional queue on the right, player bar
 * pinned to the bottom (plus a tab bar on phones). Also hosts the app-wide overlays and keyboard shortcuts.
 */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Topbar,
    Sidebar,
    PlayerBar,
    QueuePanel,
    ContextMenu,
    ConfirmDialog,
    ShortcutsDialog,
    Icon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)', '(window:beforeunload)': 'player.persist()' },
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly toasts = inject(ToastService);
  protected readonly layout = inject(LayoutService);
  protected readonly player = inject(PlayerService);
  private readonly library = inject(LibraryStore);
  private readonly menus = inject(ContextMenuService);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  protected readonly tabs = [
    { link: '/', icon: 'home', label: 'Home', exact: true },
    { link: '/search', icon: 'search', label: 'Search', exact: false },
    { link: '/collection', icon: 'library', label: 'Your Library', exact: false },
  ] as const;

  constructor() {
    // The scroll container is <main>, not window, so reset it ourselves on navigation.
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menus.close();
        this.main().nativeElement.scrollTo({ top: 0 });
      });

    // Resume the last session of this user (paused); logging out destroys the shell and stops playback.
    const userId = inject(AuthService).user()?.id;
    if (userId !== undefined) this.player.restore(userId);
    inject(DestroyRef).onDestroy(() => this.player.reset());
  }

  protected onMainScroll(): void {
    this.menus.close();
  }

  /** Spotify-like shortcuts; ignored while typing in a field. See ShortcutsDialog for the list. */
  protected onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const ctrl = event.ctrlKey || event.metaKey;
    const p = this.player;

    const handled = (() => {
      if (event.code === 'Space' && !target.closest('button, a')) return p.toggle(), true;
      if (ctrl && event.key === 'ArrowRight') return p.next(), true;
      if (ctrl && event.key === 'ArrowLeft') return p.previous(), true;
      if (ctrl && event.key === 'ArrowUp') return p.setVolume(p.volume() + VOLUME_STEP), true;
      if (ctrl && event.key === 'ArrowDown') return p.setVolume(p.volume() - VOLUME_STEP), true;
      if (event.shiftKey && event.key === 'ArrowRight') return p.seekBy(SEEK_STEP_SEC), true;
      if (event.shiftKey && event.key === 'ArrowLeft') return p.seekBy(-SEEK_STEP_SEC), true;
      if (ctrl || event.altKey) return false;
      switch (event.key) {
        case 'm':
        case 'M':
          return p.toggleMute(), true;
        case 's':
        case 'S':
          return p.toggleShuffle(), true;
        case 'r':
        case 'R':
          return p.cycleRepeat(), true;
        case 'l':
        case 'L': {
          const track = p.current();
          if (track) this.library.toggleLike(track);
          return true;
        }
        case 'q':
        case 'Q':
          return this.layout.toggleQueue(), true;
        case '/':
          document.getElementById('global-search')?.focus();
          return true;
        case '?':
          return this.layout.shortcutsOpen.set(true), true;
        default:
          return false;
      }
    })();
    if (handled) event.preventDefault();
  }
}
