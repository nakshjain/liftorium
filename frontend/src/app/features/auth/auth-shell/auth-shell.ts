import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-shell',
  imports: [RouterLink],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss'
})
export class AuthShellComponent {
  /** @deprecated Eyebrows removed from auth screens per design revision. Input kept for backwards compatibility. */
  @Input() public eyebrow = '';
  @Input({ required: true }) public title = '';
  @Input() public description = '';
}
