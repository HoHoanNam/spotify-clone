import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LibraryPanel } from '../../layout/library-panel/library-panel';

/** /collection — "Your Library" as a full page, for phones where the sidebar is hidden. */
@Component({
  selector: 'app-collection-page',
  imports: [LibraryPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './collection-page.html',
})
export class CollectionPage {}
