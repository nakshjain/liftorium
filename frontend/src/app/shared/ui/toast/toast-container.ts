import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [],
  styles: [`
    /*
      CSS transitions, not keyframes. Transitions are interruptible —
      when toasts stack rapidly, they retarget smoothly instead of restarting.
      @starting-style triggers the enter transition on first paint.
    */
    .toast {
      opacity: 1;
      transform: translateY(0) scale(1);
      transition:
        opacity 280ms cubic-bezier(0.16, 1, 0.3, 1),
        transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    @starting-style {
      .toast {
        opacity: 0;
        transform: translateY(10px) scale(0.97);
      }
    }

    /* Dismiss button — small but needs clear press feedback */
    .toast-dismiss {
      transition: color 120ms ease, transform 80ms ease;
    }
    .toast-dismiss:active {
      transform: scale(0.85);
    }

    @media (prefers-reduced-motion: reduce) {
      .toast { transition: opacity 150ms ease; }
      @starting-style { .toast { transform: none; } }
      .toast-dismiss:active { transform: none; }
    }
  `],
  template: `
    <div
      class="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 sm:left-auto sm:w-96"
      aria-live="polite"
      aria-label="Notifications"
    >
      @for (toast of toastService.activeToasts(); track toast.id) {
        <div
          class="toast flex items-center gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-sm"
          [class.border-teal-400\/40]="toast.type === 'success'"
          [class.bg-teal-950\/90]="toast.type === 'success'"
          [class.border-rose-400\/40]="toast.type === 'error'"
          [class.bg-rose-950\/90]="toast.type === 'error'"
          [class.border-zinc-700]="toast.type === 'info'"
          [class.bg-zinc-900\/90]="toast.type === 'info'"
          role="status"
        >
          <p
            class="flex-1 text-sm leading-snug"
            [class.text-teal-100]="toast.type === 'success'"
            [class.text-rose-100]="toast.type === 'error'"
            [class.text-zinc-100]="toast.type === 'info'"
          >{{ toast.message }}</p>

          @if (toast.action) {
            <button
              class="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold"
              style="transition: transform 80ms ease, opacity 120ms ease;"
              [style.active:transform]="'scale(0.95)'"
              [class.bg-teal-400]="toast.type === 'success'"
              [class.text-zinc-950]="toast.type === 'success'"
              [class.bg-rose-400]="toast.type === 'error'"
              [class.bg-zinc-700]="toast.type === 'info'"
              [class.text-zinc-100]="toast.type === 'info'"
              type="button"
              (click)="toast.action!.handler(); toastService.dismiss(toast.id)"
            >{{ toast.action.label }}</button>
          }

          <button
            class="toast-dismiss shrink-0 text-zinc-400 hover:text-zinc-200"
            type="button"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Dismiss notification"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
