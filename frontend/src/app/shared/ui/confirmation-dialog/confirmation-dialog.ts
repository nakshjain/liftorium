import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" (click)="onCancel()"></div>
        <div class="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
          <h2 class="text-xl font-semibold text-zinc-50">{{ title }}</h2>
          <p class="mt-3 text-sm leading-relaxed text-zinc-400">{{ message }}</p>
          @if (details) {
            <p class="mt-2 text-sm font-medium text-zinc-300">{{ details }}</p>
          }
          <div class="mt-6 flex gap-3">
            <button
              class="h-12 flex-1 rounded-lg border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800 active:scale-[0.99]"
              type="button"
              (click)="onCancel()"
            >
              {{ cancelLabel }}
            </button>
            <button
              class="h-12 flex-1 rounded-lg px-4 text-sm font-bold transition active:scale-[0.99]"
              [class.bg-teal-400]="!destructive"
              [class.text-zinc-950]="!destructive"
              [class.hover:bg-teal-300]="!destructive"
              [class.bg-rose-500]="destructive"
              [class.text-zinc-50]="destructive"
              [class.hover:bg-rose-400]="destructive"
              type="button"
              (click)="onConfirm()"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmationDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm action';
  @Input() message = 'Are you sure?';
  @Input() details: string | null = null;
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() destructive = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  protected onConfirm(): void {
    this.confirm.emit();
  }

  protected onCancel(): void {
    this.cancel.emit();
  }
}
