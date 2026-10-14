import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LibraryPanel } from '../library-panel/library-panel';

/** Left column of the shell: "Your Library". */
@Component({
  selector: 'app-sidebar',
  imports: [LibraryPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
})
export class Sidebar {}
