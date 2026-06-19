import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-gate-modal',
  imports: [],
  styles: [`
    /* Backdrop fades in independently — separate layer from card */
    .modal-backdrop {
      animation: backdrop-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both;
    }
    @keyframes backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* Card settles from slightly above — drops into place, feels weighted */
    .modal-card {
      animation: modal-card-in 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes modal-card-in {
      from {
        opacity: 0;
        transform: translateY(-10px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Press feedback on modal buttons — same 80ms snap as lft-btn */
    .modal-btn {
      transition:
        background-color 150ms cubic-bezier(0.23, 1, 0.32, 1),
        border-color 150ms cubic-bezier(0.23, 1, 0.32, 1),
        color 150ms cubic-bezier(0.23, 1, 0.32, 1),
        transform 80ms cubic-bezier(0.23, 1, 0.32, 1);
      will-change: transform;
    }
    .modal-btn:active:not(:disabled) {
      transform: scale(0.97);
      transition-duration: 80ms;
    }
    .modal-btn:focus-visible {
      outline: 2px solid #2dd4bf;
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      .modal-backdrop, .modal-card { animation: none; }
      .modal-btn:active { transform: none; }
    }
  `],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop — fades in separately -->
      <div
        class="modal-backdrop absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        (click)="onMaybeLater()"
      ></div>

      <!-- Modal card — settles from slightly above center -->
      <div class="modal-card relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
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
        <h2 class="mt-5 text-center text-xl font-bold tracking-tight text-zinc-50">
          Save your progress
        </h2>

        <!-- Subtext -->
        <p class="mt-2 text-center text-sm leading-relaxed text-zinc-400">
          Create a free account to sync workouts, track personal records, view history, and access analytics.
        </p>

        <!-- Actions -->
        <div class="mt-7 flex flex-col gap-3">
          <button
            type="button"
            class="modal-btn h-12 w-full rounded-xl bg-teal-400 px-4 text-sm font-bold text-zinc-950 hover:bg-teal-300"
            (click)="onSignUp()"
          >Sign Up Free</button>

          <button
            type="button"
            class="modal-btn h-12 w-full rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600"
            (click)="onLogin()"
          >Login</button>

          <button
            type="button"
            class="modal-btn mt-1 text-sm text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
            (click)="onMaybeLater()"
          >Continue as Guest</button>
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
    this.dismissed.emit();
    void this.router.navigate(['/auth/signup']);
  }

  protected onLogin(): void {
    this.dismissed.emit();
    void this.router.navigate(['/auth/login']);
  }

  protected onMaybeLater(): void {
    this.dismissed.emit();
  }
}
