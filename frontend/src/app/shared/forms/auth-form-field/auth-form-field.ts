import { Component, Input, signal } from '@angular/core';
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
  @Input() public inputmode = '';

  protected readonly showPassword = signal(false);

  protected get effectiveType(): 'email' | 'password' | 'text' {
    return this.type === 'password' && this.showPassword() ? 'text' : this.type;
  }

  protected get effectiveInputMode(): string | null {
    if (this.inputmode) return this.inputmode;
    if (this.type === 'email') return 'email';
    return null;
  }

  protected togglePassword(): void {
    this.showPassword.update(v => !v);
  }

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
