import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api.config';
import { BYPASS_AUTH_INTERCEPTOR } from '../../../core/auth/auth.context';
import { HttpContext } from '@angular/common/http';
import { AuthFormFieldComponent } from '../../../shared/forms/auth-form-field/auth-form-field';
import { AuthShellComponent } from '../auth-shell/auth-shell';

@Component({
  selector: 'app-forgot-password-page',
  imports: [AuthShellComponent, AuthFormFieldComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-page.html'
})
export class ForgotPasswordPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  private readonly formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });
  protected readonly submitDisabled = computed(() => this.loading() || this.formStatus() !== 'VALID');

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const context = new HttpContext().set(BYPASS_AUTH_INTERCEPTOR, true);
    this.http
      .post(`${this.apiBaseUrl}/auth/forgot-password`, this.form.getRawValue(), { context })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.submitted.set(true),
        error: () => {
          // Always show success to avoid email enumeration
          this.submitted.set(true);
        }
      });
  }
}
