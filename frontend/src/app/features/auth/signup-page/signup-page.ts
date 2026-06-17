import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../../core/auth/auth-api-error';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthFormFieldComponent } from '../../../shared/forms/auth-form-field/auth-form-field';
import { AuthShellComponent } from '../auth-shell/auth-shell';
import { WorkoutSyncService } from '../../workouts/workout-sync.service';

@Component({
  selector: 'app-signup-page',
  imports: [AuthShellComponent, AuthFormFieldComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './signup-page.html',
  styleUrl: './signup-page.scss'
})
export class SignupPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly workoutSyncService = inject(WorkoutSyncService);

  protected readonly step = signal<'form' | 'otp'>('form');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly resendCooldown = signal(0);
  private resendInterval: ReturnType<typeof setInterval> | null = null;

  protected readonly form = this.formBuilder.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  protected readonly otpForm = this.formBuilder.nonNullable.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]]
  });

  private readonly formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });
  private readonly otpFormStatus = toSignal(this.otpForm.statusChanges, { initialValue: this.otpForm.status });

  protected readonly submitDisabled = computed(() => this.loading() || this.formStatus() !== 'VALID');
  protected readonly verifyDisabled = computed(() => this.loading() || this.otpFormStatus() !== 'VALID');
  protected readonly submitButtonLabel = computed(() => (this.loading() ? 'Sending code...' : 'Continue'));
  protected readonly verifyButtonLabel = computed(() => (this.loading() ? 'Verifying...' : 'Verify & create account'));
  protected readonly resendDisabled = computed(() => this.loading() || this.resendCooldown() > 0);

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .signupInitiate(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.step.set('otp');
          this.startResendCooldown();
        },
        error: (error: unknown) => {
          this.errorMessage.set(getApiErrorMessage(error));
        }
      });
  }

  protected verify(): void {
    this.otpForm.markAllAsTouched();

    if (this.otpForm.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const email = this.form.getRawValue().email;
    const otp = this.otpForm.getRawValue().otp;

    this.authService
      .signupVerify({ email, otp })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          void this.workoutSyncService.checkForPendingWorkouts();
          void this.router.navigateByUrl('/app');
        },
        error: (error: unknown) => {
          this.errorMessage.set(getApiErrorMessage(error));
        }
      });
  }

  protected resendOtp(): void {
    if (this.resendDisabled()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .signupInitiate(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.startResendCooldown();
        },
        error: (error: unknown) => {
          this.errorMessage.set(getApiErrorMessage(error));
        }
      });
  }

  protected goBack(): void {
    this.step.set('form');
    this.errorMessage.set(null);
    this.otpForm.reset();
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
    this.resendInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        if (this.resendInterval) {
          clearInterval(this.resendInterval);
          this.resendInterval = null;
        }
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }
}
