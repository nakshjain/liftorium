import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthGateService } from '../../../core/auth/auth-gate.service';
import { AuthGateModalComponent } from '../../../shared/ui/auth-gate-modal/auth-gate-modal';

interface FeatureCard {
  title: string;
  description: string;
  locked: boolean;
  route?: string;
  icon: string;
}

@Component({
  selector: 'app-guest-dashboard',
  standalone: true,
  imports: [AuthGateModalComponent],
  template: `
    <!-- Auth Gate Modal -->
    @if (activeModal()) {
      <app-auth-gate-modal
        [featureName]="activeModal()!"
        (dismissed)="closeModal()"
      />
    }

    <div class="min-h-screen bg-zinc-950 px-4 pb-24 pt-10">

      <!-- Hero section -->
      <section class="mx-auto max-w-md text-center">
        <h1 class="text-3xl font-bold tracking-tight text-zinc-50">
          Ready to train?
        </h1>
        <p class="mt-3 text-base leading-relaxed text-zinc-400">
          Track your workouts, beat your PRs, and build real strength — no account needed to start.
        </p>

        <button
          type="button"
          class="mt-8 w-full rounded-2xl bg-teal-400 py-4 text-base font-bold text-zinc-950 shadow-lg transition hover:bg-teal-300 active:scale-[0.98]"
          (click)="startWorkout()"
        >
          Start Workout
        </button>
      </section>

      <!-- Feature cards grid -->
      <section class="mx-auto mt-12 max-w-md">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Features
        </h2>

        <div class="grid grid-cols-2 gap-3">
          @for (card of featureCards; track card.title) {
            <button
              type="button"
              class="relative flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-left transition hover:border-zinc-700 hover:bg-zinc-800 active:scale-[0.97]"
              [class.opacity-75]="card.locked"
              (click)="onCardClick(card)"
            >
              <!-- Feature icon -->
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800">
                <span class="text-xl" [innerHTML]="card.icon"></span>
              </div>

              <!-- Lock overlay badge -->
              @if (card.locked) {
                <span class="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="h-3.5 w-3.5 text-zinc-400"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </span>
              }

              <!-- Card content -->
              <div>
                <p class="text-sm font-semibold text-zinc-100">{{ card.title }}</p>
                <p class="mt-1 text-xs leading-snug text-zinc-500">{{ card.description }}</p>
              </div>
            </button>
          }
        </div>
      </section>

      <!-- Guest nudge footer -->
      <section class="mx-auto mt-10 max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-center">
        <p class="text-sm text-zinc-400">
          Create a free account to unlock all features and sync your data across devices.
        </p>
        <div class="mt-4 flex gap-3">
          <a
            href="/auth/signup"
            class="flex-1 rounded-xl bg-teal-400 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-teal-300"
          >
            Sign Up Free
          </a>
          <a
            href="/auth/login"
            class="flex-1 rounded-xl border border-zinc-700 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
          >
            Login
          </a>
        </div>
      </section>

    </div>
  `,
})
export class GuestDashboardComponent {
  private readonly router = inject(Router);
  protected readonly authGateService = inject(AuthGateService);

  protected readonly activeModal = signal<string | null>(null);

  protected readonly featureCards: FeatureCard[] = [
    {
      title: 'Workout Tracking',
      description: 'Log sets, reps and weight in real time.',
      locked: false,
      route: '/app/workout',
      icon: '🏋️',
    },
    {
      title: 'Progressive Overload',
      description: 'Auto-suggest weight increases based on history.',
      locked: true,
      icon: '📈',
    },
    {
      title: 'Analytics',
      description: 'Visualise volume, frequency and strength gains.',
      locked: true,
      icon: '📊',
    },
    {
      title: 'PR Tracking',
      description: 'Automatically record personal records per lift.',
      locked: true,
      icon: '🏆',
    },
  ];

  protected startWorkout(): void {
    void this.router.navigate(['/app/workout']);
  }

  protected onCardClick(card: FeatureCard): void {
    if (card.locked) {
      this.authGateService.pendingFeature.set(card.title);
      this.activeModal.set(card.title);
    } else if (card.route) {
      void this.router.navigate([card.route]);
    }
  }

  protected closeModal(): void {
    this.activeModal.set(null);
    this.authGateService.pendingFeature.set(null);
  }
}
