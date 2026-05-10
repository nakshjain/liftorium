import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-shell',
  imports: [RouterLink],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss'
})
export class AuthShellComponent {
  @Input({ required: true }) public eyebrow = '';
  @Input({ required: true }) public title = '';
  @Input({ required: true }) public description = '';
}
