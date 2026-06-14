import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../../core/auth/auth-api-error';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthFormFieldComponent } from '../../../shared/forms/auth-form-field/auth-form-field';
import { AuthShellComponent } from '../auth-shell/auth-shell';

type Step = 'email' | 'otp' | 'password';

const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pw = group.get('newPassword')?.value as string;
  const confirm = group.get('confirmPassword')?.value as string;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-forgot-password-page',
  imports: [AuthShellComponent, AuthFormFieldComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-page.html'
})
export class ForgotPasswordPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly step = signal<Step>('email');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly resendCooldown = signal(0);
  private resendInterval: ReturnType<typeof setInterval> | null = null;

  protected readonly emailForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  protected readonly otpForm = this.formBuilder.nonNullable.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]]
  });

  protected readonly passwordForm = this.formBuilder.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordsMatch }
  );

  private readonly emailFormStatus = toSignal(this.emailForm.statusChanges, { initialValue: this.emailForm.status });
  private readonly otpFormStatus = toSignal(this.otpForm.statusChanges, { initialValue: this.otpForm.status });
  private readonly passwordFormStatus = toSignal(this.passwordForm.statusChanges, { initialValue: this.passwordForm.status });

  protected readonly emailSubmitDisabled = computed(() => this.loading() || this.emailFormStatus() !== 'VALID');
  protected readonly otpSubmitDisabled = computed(() => this.loading() || this.otpFormStatus() !== 'VALID');
  protected readonly passwordSubmitDisabled = computed(() => this.loading() || this.passwordFormStatus() !== 'VALID');
  protected readonly resendDisabled = computed(() => this.loading() || this.resendCooldown() > 0);

  protected get passwordMismatch(): boolean {
    return this.passwordForm.hasError('passwordMismatch') &&
      (this.passwordForm.controls.confirmPassword.dirty || this.passwordForm.controls.confirmPassword.touched);
  }

  protected submitEmail(): void {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .forgotPassword(this.emailForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.step.set('otp');
          this.startResendCooldown();
        },
        error: () => {
          // Always advance to OTP step — suppress enumeration
          this.step.set('otp');
          this.startResendCooldown();
        }
      });
  }

  protected submitOtp(): void {
    this.otpForm.markAllAsTouched();
    if (this.otpForm.invalid || this.loading()) return;
    this.step.set('password');
    this.errorMessage.set(null);
  }

  protected submitPassword(): void {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const { newPassword } = this.passwordForm.getRawValue();
    const email = this.emailForm.getRawValue().email;
    const otp = this.otpForm.getRawValue().otp;

    this.authService
      .resetPassword({ email, otp, newPassword })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/app'),
        error: (error: unknown) => {
          this.errorMessage.set(getApiErrorMessage(error));
          // OTP was invalid or expired — go back to OTP step
          this.step.set('otp');
          this.otpForm.reset();
        }
      });
  }

  protected resendOtp(): void {
    if (this.resendDisabled()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .forgotPassword(this.emailForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.startResendCooldown(),
        error: () => this.startResendCooldown()
      });
  }

  protected goBackToEmail(): void {
    this.step.set('email');
    this.otpForm.reset();
    this.passwordForm.reset();
    this.errorMessage.set(null);
    this.stopResendCooldown();
  }

  protected goBackToOtp(): void {
    this.step.set('otp');
    this.passwordForm.reset();
    this.errorMessage.set(null);
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);
    if (this.resendInterval) clearInterval(this.resendInterval);
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

  private stopResendCooldown(): void {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
      this.resendInterval = null;
    }
    this.resendCooldown.set(0);
  }
}
