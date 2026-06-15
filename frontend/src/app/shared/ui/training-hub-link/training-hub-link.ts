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
      class="text-sm font-medium text-zinc-400 transition hover:text-zinc-200"
      routerLink="/app"
    >← Training hub</a>
  `,
})
export class TrainingHubLinkComponent {}
