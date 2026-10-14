import { ChangeDetectionStrategy, Component, ElementRef, effect, input, model, viewChild } from '@angular/core';
import { Icon } from '../../shared/icon';

/** Styled file picker with two-way binding: [(file)]. Setting file to null clears the native input. */
@Component({
  selector: 'app-file-field',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './file-field.html',
})
export class FileField {
  readonly label = input.required<string>();
  readonly accept = input('');
  readonly hint = input('Choose a file');
  readonly required = input(false);
  readonly invalid = input(false);
  readonly file = model<File | null>(null);

  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('input');

  constructor() {
    effect(() => {
      if (!this.file()) this.inputEl().nativeElement.value = '';
    });
  }

  protected onChange(el: HTMLInputElement): void {
    this.file.set(el.files?.[0] ?? null);
  }
}
