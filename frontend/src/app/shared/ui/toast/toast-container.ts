import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [],
  styles: [`
    @media (prefers-reduced-motion: reduce) {
      .toast-enter {
        animation: none !important;
        opacity: 1 !important;
      }
    }
  `],
  template: `
    <div class="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 sm:left-auto sm:w-96">
      @for (toast of toastService.activeToasts(); track toast.id) {
        <div
          class="toast-enter flex items-center gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-2"
          [class.border-teal-400/40]="toast.type === 'success'"
          [class.bg-teal-950/90]="toast.type === 'success'"
          [class.border-rose-400/40]="toast.type === 'error'"
          [class.bg-rose-950/90]="toast.type === 'error'"
          [class.border-zinc-700]="toast.type === 'info'"
          [class.bg-zinc-900/90]="toast.type === 'info'"
        >
          <p
            class="flex-1 text-sm leading-snug"
            [class.text-teal-100]="toast.type === 'success'"
            [class.text-rose-100]="toast.type === 'error'"
            [class.text-zinc-100]="toast.type === 'info'"
          >
            {{ toast.message }}
          </p>
          @if (toast.action) {
            <button
              class="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition active:scale-95"
              [class.bg-teal-400]="toast.type === 'success'"
              [class.text-zinc-950]="toast.type === 'success'"
              [class.bg-rose-400]="toast.type === 'error'"
              [class.text-zinc-950]="toast.type === 'error'"
              [class.bg-zinc-700]="toast.type === 'info'"
              [class.text-zinc-100]="toast.type === 'info'"
              type="button"
              (click)="toast.action!.handler(); toastService.dismiss(toast.id)"
            >
              {{ toast.action.label }}
            </button>
          }
          <button
            class="shrink-0 text-zinc-400 transition hover:text-zinc-200"
            type="button"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Dismiss"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
