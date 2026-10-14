import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Modal } from '../../shared/dialog/modal';
import { LayoutService } from '../layout.service';

/** Keyboard shortcut list (press "?" or open it from the account menu). Handled in Shell.onKeydown. */
@Component({
  selector: 'app-shortcuts-dialog',
  imports: [Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shortcuts-dialog.html',
})
export class ShortcutsDialog {
  protected readonly layout = inject(LayoutService);
  protected readonly groups = [
    {
      title: 'Playback',
      items: [
        { keys: ['Space'], label: 'Play / pause' },
        { keys: ['Ctrl', '→'], label: 'Next' },
        { keys: ['Ctrl', '←'], label: 'Previous' },
        { keys: ['Shift', '→'], label: 'Seek forward 5 seconds' },
        { keys: ['Shift', '←'], label: 'Seek backward 5 seconds' },
        { keys: ['Ctrl', '↑'], label: 'Volume up' },
        { keys: ['Ctrl', '↓'], label: 'Volume down' },
        { keys: ['M'], label: 'Mute / unmute' },
        { keys: ['S'], label: 'Shuffle' },
        { keys: ['R'], label: 'Repeat' },
        { keys: ['L'], label: 'Like the current song' },
      ],
    },
    {
      title: 'Navigation',
      items: [
        { keys: ['/'], label: 'Search' },
        { keys: ['Q'], label: 'Show / hide the queue' },
        { keys: ['?'], label: 'Keyboard shortcuts' },
      ],
    },
  ];
}
