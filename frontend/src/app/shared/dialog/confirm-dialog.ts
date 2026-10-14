import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmService } from './confirm.service';
import { Modal } from './modal';

@Component({
  selector: 'app-confirm-dialog',
  imports: [Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  protected readonly confirms = inject(ConfirmService);
}
