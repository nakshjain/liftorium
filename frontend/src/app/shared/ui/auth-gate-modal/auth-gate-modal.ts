import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-gate-modal',
  imports: [],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        (click)="onMaybeLater()"
      ></div>

      <!-- Modal card -->
      <div class="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <!-- Lock icon -->
        <div class="flex justify-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-8 w-8 text-teal-400"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </div>

        <!-- Heading -->
        <h2 class="mt-5 text-center text-xl font-semibold text-zinc-50">
          Save your progress
        </h2>

        <!-- Subtext -->
        <p class="mt-2 text-center text-sm leading-relaxed text-zinc-400">
          Create a free account to sync workouts, track personal records, view history, and access analytics.
        </p>

        <!-- Actions -->
        <div class="mt-8 flex flex-col gap-3">
          <button
            type="button"
            class="h-12 w-full rounded-xl bg-teal-400 px-4 text-sm font-bold text-zinc-950 transition hover:bg-teal-300 active:scale-[0.98]"
            (click)="onSignUp()"
          >
            Sign Up
          </button>

          <button
            type="button"
            class="h-12 w-full rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800 active:scale-[0.98]"
            (click)="onLogin()"
          >
            Login
          </button>

          <button
            type="button"
            class="mt-1 text-sm text-zinc-500 underline-offset-2 transition hover:text-zinc-300 hover:underline"
            (click)="onMaybeLater()"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AuthGateModalComponent {
  @Input() featureName: string = 'This Feature';
  @Output() dismissed = new EventEmitter<void>();

  private readonly router = inject(Router);

  protected onSignUp(): void {
    void this.router.navigate(['/auth/signup']);
  }

  protected onLogin(): void {
    void this.router.navigate(['/auth/login']);
  }

  protected onMaybeLater(): void {
    this.dismissed.emit();
  }
}
