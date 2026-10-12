import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { PlayerBar } from '../player-bar/player-bar';

/** App frame: sidebar on the left, scrollable main content, player bar pinned to the bottom. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, PlayerBar],
  template: `
    <div class="grid h-screen grid-rows-[1fr_auto] gap-2 p-2">
      <div class="grid min-h-0 grid-cols-[280px_1fr] gap-2">
        <app-sidebar />
        <main class="min-h-0 overflow-y-auto rounded-lg bg-base">
          <router-outlet />
        </main>
      </div>
      <app-player-bar />
    </div>
  `,
})
export class Shell {}
