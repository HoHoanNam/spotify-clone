import { ChangeDetectionStrategy, Component, WritableSignal, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AccountService } from '../../core/api/account.service';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models';
import { errorMessage } from '../../core/util/loadable';
import { CoverImage } from '../../shared/cover-image';
import { Icon } from '../../shared/icon';
import { ToastService } from '../../shared/toast.service';

/** /settings — display name, profile photo and password of the logged-in user. */
@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule, CoverImage, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-page.html',
})
export class SettingsPage {
  protected readonly auth = inject(AuthService);
  private readonly account = inject(AccountService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly profileForm = this.fb.group({
    username: [this.auth.user()?.username ?? '', [Validators.required, Validators.maxLength(100)]],
  });
  protected readonly passwordForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  protected readonly savingName = signal(false);
  protected readonly savingAvatar = signal(false);
  protected readonly savingPassword = signal(false);
  protected readonly passwordError = signal<string | null>(null);

  protected saveName(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.run(this.account.rename(this.profileForm.getRawValue().username.trim()), this.savingName, 'Profile saved');
  }

  protected pickAvatar(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (file) this.run(this.account.uploadAvatar(file), this.savingAvatar, 'Photo updated');
  }

  protected removeAvatar(): void {
    this.run(this.account.removeAvatar(), this.savingAvatar, 'Photo removed');
  }

  protected changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.savingPassword.set(true);
    this.passwordError.set(null);
    this.account.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordForm.reset();
        this.toast.show('Password changed');
      },
      error: (err) => {
        this.savingPassword.set(false);
        this.passwordError.set(errorMessage(err));
      },
    });
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  private run(request: Observable<User>, busy: WritableSignal<boolean>, message: string): void {
    busy.set(true);
    request.subscribe({
      next: () => {
        busy.set(false);
        this.toast.show(message);
      },
      error: (err) => {
        busy.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }
}

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const { newPassword, confirm } = group.value as { newPassword: string; confirm: string };
  return confirm && newPassword !== confirm ? { mismatch: true } : null;
}
