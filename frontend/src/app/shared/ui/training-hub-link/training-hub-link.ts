import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Shared "← Training hub" back-link used in every authenticated page header.
 *
 * Usage:
 *   <app-training-hub-link />
 */
@Component({
  selector: 'app-training-hub-link',
  imports: [RouterLink],
  template: `
    <a
      class="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 transition hover:text-zinc-400"
      routerLink="/app"
    >← Hub</a>
  `,
})
export class TrainingHubLinkComponent {}
