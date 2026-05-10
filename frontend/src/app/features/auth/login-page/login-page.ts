import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../../core/auth/auth-api-error';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthFormFieldComponent } from '../../../shared/forms/auth-form-field/auth-form-field';
import { AuthShellComponent } from '../auth-shell/auth-shell';

@Component({
  selector: 'app-login-page',
  imports: [AuthShellComponent, AuthFormFieldComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  private readonly formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  protected readonly submitDisabled = computed(() => this.loading() || this.formStatus() !== 'VALID');
  protected readonly submitButtonLabel = computed(() => (this.loading() ? 'Signing in...' : 'Sign in'));

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/app');
        },
        error: (error: unknown) => {
          this.errorMessage.set(getApiErrorMessage(error));
        }
      });
  }
}
