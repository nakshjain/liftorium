import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

/**
 * Reusable search input for exercises.
 * Renders a styled search field with a pulsing icon while the debounce is
 * pending. Emits (queryChange) on every keystroke — the parent owns the
 * debounce and the results list.
 */
@Component({
  selector: 'app-exercise-search-input',
  standalone: true,
  templateUrl: './exercise-search-input.html',
})
export class ExerciseSearchInputComponent {
  /** Whether the parent's debounce timer is still running. Shows pulsing icon. */
  @Input() pending = false;

  /** Placeholder text. */
  @Input() placeholder = 'Search exercises...';

  /** Emits raw value on every input event. */
  @Output() queryChange = new EventEmitter<string>();

  protected readonly value = signal('');

  protected onInput(raw: string): void {
    this.value.set(raw);
    this.queryChange.emit(raw);
  }
}
