import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="flex min-h-0 flex-col gap-2">
      <nav class="rounded-lg bg-base p-4">
        <a
          routerLink="/"
          routerLinkActive="text-white"
          [routerLinkActiveOptions]="{ exact: true }"
          class="block py-2 font-semibold text-subdued hover:text-white"
          >Home</a
        >
        <span class="block py-2 font-semibold text-subdued">Search</span>
      </nav>
      <section class="flex-1 rounded-lg bg-base p-4">
        <h2 class="font-semibold text-subdued">Your Library</h2>
      </section>
    </aside>
  `,
})
export class Sidebar {}
