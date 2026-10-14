import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input, output } from '@angular/core';

/**
 * Put on an empty element at the end of a list: emits when it gets near the viewport.
 * IntersectionObserver also accounts for clipping by the scrolling <main>, so it works inside the shell.
 *
 * It only fires when visibility changes, so render the sentinel inside `@if (!list.loading())`:
 * a fresh element after each page fires again if the list is still too short to fill the screen.
 */
@Directive({ selector: '[appInfiniteScroll]' })
export class InfiniteScroll {
  readonly appInfiniteScroll = output<void>();
  /** Start loading this far before the end is visible. */
  readonly margin = input('600px');

  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement;
    let observer: IntersectionObserver | undefined;
    afterNextRender(() => {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) this.appInfiniteScroll.emit();
        },
        { rootMargin: this.margin() },
      );
      observer.observe(el);
    });
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }
}
