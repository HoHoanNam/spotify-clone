import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { Icon } from '../icon';
import { ContextMenuService, MenuItem, OpenMenu } from './context-menu.service';

const MENU_WIDTH = 256;
const MARGIN = 8;

/** Renders ContextMenuService.menu. Kept inside the viewport; submenus flip left near the right edge. */
@Component({
  selector: 'app-context-menu',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousedown)': 'onOutside($event)',
    '(document:keydown.escape)': 'menus.close()',
    '(window:resize)': 'menus.close()',
    '(window:blur)': 'menus.close()',
  },
  templateUrl: './context-menu.html',
})
export class ContextMenu {
  protected readonly menus = inject(ContextMenuService);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly left = signal(0);
  protected readonly top = signal(0);
  protected readonly openChild = signal<number | null>(null);
  protected readonly childLeftSide = signal(false);
  /** The menu that has been measured and placed; hidden until then so it never flashes at (0, 0). */
  protected readonly placed = signal<OpenMenu | null>(null);

  constructor() {
    // Position after render, when the panel height is known
    afterRenderEffect(() => {
      const menu = this.menus.menu();
      const panel = this.panel()?.nativeElement;
      this.openChild.set(null);
      if (!menu || !panel) return;
      const height = panel.offsetHeight;
      const x = Math.min(menu.x, window.innerWidth - MENU_WIDTH - MARGIN);
      const y = menu.y + height > window.innerHeight - MARGIN ? Math.max(MARGIN, menu.y - height) : menu.y;
      this.left.set(Math.max(MARGIN, x));
      this.top.set(y);
      this.childLeftSide.set(x + MENU_WIDTH * 2 > window.innerWidth);
      this.placed.set(menu);
      panel.focus();
    });
  }

  protected run(item: MenuItem): void {
    if (item.children) return;
    this.menus.close();
    item.action?.();
  }

  protected onOutside(event: MouseEvent): void {
    if (!this.panel()?.nativeElement.contains(event.target as Node)) this.menus.close();
  }
}
