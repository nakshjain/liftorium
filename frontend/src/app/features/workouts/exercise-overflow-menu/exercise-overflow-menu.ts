import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
} from '@angular/core';

export type ExerciseOverflowAction =
  | 'add-set'
  | 'remove-last-set'
  | 'replace'
  | 'move-up'
  | 'move-down'
  | 'remove';

@Component({
  selector: 'app-exercise-overflow-menu',
  standalone: true,
  template: `
    <div class="relative">
      <!-- Trigger -->
      <button
        class="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 active:bg-zinc-700"
        type="button"
        [attr.aria-label]="'Exercise options'"
        [attr.aria-expanded]="open()"
        [attr.aria-haspopup]="'menu'"
        (click)="toggle($event)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="8" cy="3"  r="1.4"/>
          <circle cx="8" cy="8"  r="1.4"/>
          <circle cx="8" cy="13" r="1.4"/>
        </svg>
      </button>

      <!-- Dropdown panel -->
      @if (open()) {
        <div
          class="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
          role="menu"
          aria-orientation="vertical"
        >
          <!-- Set actions -->
          <button class="lft-overflow-item" type="button" role="menuitem" (click)="emit('add-set')">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M8 3v10M3 8h10"/>
            </svg>
            Add set
          </button>

          <button
            class="lft-overflow-item"
            [class.opacity-30]="!canRemoveSet"
            [class.pointer-events-none]="!canRemoveSet"
            type="button"
            role="menuitem"
            [attr.aria-disabled]="!canRemoveSet"
            (click)="emit('remove-last-set')"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 8h10"/>
            </svg>
            Remove last set
          </button>

          <div class="mx-3 border-t border-zinc-800"></div>

          <!-- Exercise actions -->
          <button class="lft-overflow-item" type="button" role="menuitem" (click)="emit('replace')">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8z"/>
              <path d="M8 5v6M5 8l3-3 3 3"/>
            </svg>
            Replace exercise
          </button>

          <button
            class="lft-overflow-item"
            [class.opacity-30]="!canMoveUp"
            [class.pointer-events-none]="!canMoveUp"
            type="button"
            role="menuitem"
            [attr.aria-disabled]="!canMoveUp"
            (click)="emit('move-up')"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M8 13V3M4 7l4-4 4 4"/>
            </svg>
            Move up
          </button>

          <button
            class="lft-overflow-item"
            [class.opacity-30]="!canMoveDown"
            [class.pointer-events-none]="!canMoveDown"
            type="button"
            role="menuitem"
            [attr.aria-disabled]="!canMoveDown"
            (click)="emit('move-down')"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M8 3v10M12 9l-4 4-4-4"/>
            </svg>
            Move down
          </button>

          <div class="mx-3 border-t border-zinc-800"></div>

          <button
            class="lft-overflow-item lft-overflow-item-danger"
            type="button"
            role="menuitem"
            (click)="emit('remove')"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9"/>
            </svg>
            Remove exercise
          </button>
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class ExerciseOverflowMenuComponent {
  /** True when the exercise has more than one set — enables "Remove last set". */
  @Input() canRemoveSet = false;
  /** True when this is not the first exercise in the list. */
  @Input() canMoveUp = true;
  /** True when this is not the last exercise in the list. */
  @Input() canMoveDown = true;

  @Output() action = new EventEmitter<ExerciseOverflowAction>();

  protected readonly open = signal(false);

  constructor(private readonly el: ElementRef) {}

  protected toggle(event: Event): void {
    event.stopPropagation();
    this.open.update((v) => !v);
  }

  protected emit(action: ExerciseOverflowAction): void {
    this.open.set(false);
    this.action.emit(action);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.open() && !this.el.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }
}
