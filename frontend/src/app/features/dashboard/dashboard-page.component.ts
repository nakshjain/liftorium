import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard-page',
  template: `
    <main class="min-h-dvh px-4 py-6 text-zinc-50 sm:px-6">
      <div class="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-3xl flex-col">
        <header class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-teal-300">Gym Helper</p>
            <h1 class="mt-1 text-2xl font-semibold tracking-normal text-zinc-50">Training hub</h1>
          </div>
          <button
            class="rounded-lg border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:text-zinc-500"
            type="button"
            [disabled]="loggingOut()"
            (click)="logout()"
          >
            {{ loggingOut() ? 'Signing out...' : 'Sign out' }}
          </button>
        </header>

        <section class="mt-8 rounded-lg border border-zinc-800 bg-zinc-950/70 p-5">
          <p class="text-sm text-zinc-400">Signed in as</p>
          <p class="mt-2 text-lg font-semibold text-zinc-50">{{ authService.user()?.displayName }}</p>
          <p class="text-sm text-zinc-400">{{ authService.user()?.email }}</p>
        </section>

        <section class="mt-5 grid gap-3 sm:grid-cols-3">
          <div class="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
            <p class="text-sm text-zinc-400">Active workout</p>
            <p class="mt-2 text-xl font-semibold text-zinc-50">Ready</p>
          </div>
          <div class="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
            <p class="text-sm text-zinc-400">Exercise catalog</p>
            <p class="mt-2 text-xl font-semibold text-zinc-50">Available</p>
          </div>
          <div class="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
            <p class="text-sm text-zinc-400">History</p>
            <p class="mt-2 text-xl font-semibold text-zinc-50">Next</p>
          </div>
        </section>
      </div>
    </main>
  `
})
export class DashboardPageComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly loggingOut = signal(false);

  protected logout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);
    this.authService
      .logout()
      .pipe(finalize(() => this.loggingOut.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/auth/login');
        },
        error: () => {
          void this.router.navigateByUrl('/auth/login');
        }
      });
  }
}
