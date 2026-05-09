import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth-form-field',
  imports: [ReactiveFormsModule],
  template: `
    <label class="block">
      <span class="mb-2 block text-sm font-medium text-zinc-200">{{ label }}</span>
      <input
        class="h-12 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 text-base text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
        [autocomplete]="autocomplete"
        [formControl]="control"
        [placeholder]="placeholder"
        [type]="type"
      />
    </label>

    @if (control.invalid && (control.dirty || control.touched)) {
      <p class="mt-2 text-sm text-rose-300">{{ errorMessage }}</p>
    }
  `
})
export class AuthFormFieldComponent {
  @Input({ required: true }) public label = '';
  @Input({ required: true }) public control!: FormControl<string>;
  @Input() public type: 'email' | 'password' | 'text' = 'text';
  @Input() public autocomplete = 'off';
  @Input() public placeholder = '';

  public get errorMessage(): string {
    if (this.control.hasError('required')) {
      return `${this.label} is required.`;
    }

    if (this.control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (this.control.hasError('minlength')) {
      return `${this.label} is too short.`;
    }

    return `${this.label} is invalid.`;
  }
}
