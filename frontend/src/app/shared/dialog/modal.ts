import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, input, output } from '@angular/core';
import { Icon } from '../icon';

/**
 * Centered dialog with a dimmed backdrop. Content is projected; Escape or a backdrop click emits (closed).
 * Focus moves into the dialog when it opens.
 */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  templateUrl: './modal.html',
})
export class Modal {
  readonly heading = input.required<string>();
  /** Tailwind max-width class of the panel. */
  readonly width = input('max-w-[524px]');
  readonly closed = output<void>();

  constructor() {
    const host = inject(ElementRef<HTMLElement>).nativeElement;
    afterNextRender(() => {
      const target = host.querySelector('[autofocus], input, textarea, select, button:not([data-close])');
      (target as HTMLElement | null)?.focus();
    });
  }
}
