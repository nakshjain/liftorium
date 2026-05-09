import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-shell',
  imports: [RouterLink],
  template: `
    <main class="min-h-dvh px-4 py-6 text-zinc-50 sm:px-6">
      <div class="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col justify-between">
        <header class="flex items-center justify-between">
          <a class="text-lg font-semibold tracking-normal text-zinc-50" routerLink="/auth/login">Gym Helper</a>
          <span class="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">MVP</span>
        </header>

        <section class="py-10">
          <div class="mb-8">
            <p class="mb-3 text-sm font-medium text-teal-300">{{ eyebrow }}</p>
            <h1 class="text-3xl font-semibold leading-tight tracking-normal text-zinc-50">{{ title }}</h1>
            <p class="mt-3 text-base leading-7 text-zinc-400">{{ description }}</p>
          </div>

          <ng-content />
        </section>

        <footer class="pb-2 text-sm text-zinc-500">
          Built for fast logging between sets.
        </footer>
      </div>
    </main>
  `
})
export class AuthShellComponent {
  @Input({ required: true }) public eyebrow = '';
  @Input({ required: true }) public title = '';
  @Input({ required: true }) public description = '';
}
