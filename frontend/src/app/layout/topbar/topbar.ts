import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Icon } from '../../shared/icon';

/** Top bar like the current Spotify desktop app: logo · home + search · account menu. */
@Component({
  selector: 'app-topbar',
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'closeMenu($event)', '(document:keydown.escape)': 'menuOpen.set(false)' },
  templateUrl: './topbar.html',
})
export class Topbar {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly menuOpen = signal(false);
  protected readonly query = new FormControl('', { nonNullable: true });

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Typing updates /search?q=... (replaceUrl so every keystroke is not a history entry)
    this.query.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(destroyRef))
      .subscribe((q) => {
        this.router.navigate(['/search'], { queryParams: q.trim() ? { q: q.trim() } : {}, replaceUrl: true });
      });

    // Keep the box in sync with the URL (back/forward, leaving the search page)
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(() => {
        const tree = this.router.parseUrl(this.router.url);
        const onSearch = tree.root.children['primary']?.segments[0]?.path === 'search';
        const q = onSearch ? (tree.queryParams['q'] ?? '') : '';
        if (q !== this.query.value && document.activeElement !== this.searchInput().nativeElement) {
          this.query.setValue(q, { emitEvent: false });
        }
      });
  }

  protected initial(): string {
    return (this.auth.user()?.username ?? '?').charAt(0).toUpperCase();
  }

  protected openSearch(): void {
    if (!this.router.url.startsWith('/search')) {
      this.router.navigate(['/search'], { queryParams: this.query.value ? { q: this.query.value } : {} });
    }
  }

  protected closeMenu(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.menuOpen.set(false);
  }

  protected logout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
  }
}
