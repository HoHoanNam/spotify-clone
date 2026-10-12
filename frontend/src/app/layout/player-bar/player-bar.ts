import { Component } from '@angular/core';

/** Placeholder; wired to PlayerService when playback is implemented. */
@Component({
  selector: 'app-player-bar',
  template: `
    <footer class="flex h-20 items-center justify-center px-4 text-sm text-subdued">
      Nothing playing
    </footer>
  `,
})
export class PlayerBar {}
