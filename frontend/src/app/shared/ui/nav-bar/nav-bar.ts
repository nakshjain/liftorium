import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthGateService } from '../../../core/auth/auth-gate.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink],
  templateUrl: 'nav-bar.html',
})
export class NavBarComponent {
  private readonly authService = inject(AuthService);
  private readonly authGateService = inject(AuthGateService);
  private readonly router = inject(Router);

  protected readonly authStatus = this.authService.status;
  protected readonly user = this.authService.user;
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected onSignOut(): void {
    this.menuOpen.set(false);
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/app']),
      error: () => this.router.navigate(['/app'])
    });
  }
}
