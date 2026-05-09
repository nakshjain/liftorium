import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../core/auth/auth-api-error';
import { AuthService } from '../../core/auth/auth.service';
import { AuthFormFieldComponent } from '../../shared/forms/auth-form-field.component';
import { AuthShellComponent } from './auth-shell.component';

@Component({
  selector: 'app-login-page',
  imports: [AuthShellComponent, AuthFormFieldComponent, ReactiveFormsModule, RouterLink],
  template: `
    <app-auth-shell
      eyebrow="Welcome back"
      title="Log your next session without friction."
      description="Sign in to continue your workout history, active sessions, and exercise tracking."
    >
      <form class="space-y-5" [formGroup]="form" (ngSubmit)="submit()">
        <app-auth-form-field
          autocomplete="email"
          label="Email"
          placeholder="you@example.com"
          type="email"
          [control]="form.controls.email"
        />

        <app-auth-form-field
          autocomplete="current-password"
          label="Password"
          placeholder="Your password"
          type="password"
          [control]="form.controls.password"
        />

        @if (errorMessage()) {
          <p class="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {{ errorMessage() }}
          </p>
        }

        <button
          class="h-12 w-full rounded-lg bg-teal-400 px-4 text-base font-semibold text-zinc-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          type="submit"
          [disabled]="submitDisabled()"
        >
          {{ loading() ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-zinc-400">
        New to Gym Helper?
        <a class="font-medium text-teal-300 hover:text-teal-200" routerLink="/auth/signup">Create an account</a>
      </p>
    </app-auth-shell>
  `
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

  protected readonly submitDisabled = computed(() => this.loading() || this.form.invalid);

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
