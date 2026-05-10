import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth-form-field',
  imports: [ReactiveFormsModule],
  templateUrl: './auth-form-field.html',
  styleUrl: './auth-form-field.scss'
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
