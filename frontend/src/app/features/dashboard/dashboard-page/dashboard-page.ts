import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPageComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly loggingOut = signal(false);
  protected readonly logoutButtonLabel = computed(() => (this.loggingOut() ? 'Signing out...' : 'Sign out'));

  protected logout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);
    this.authService
      .logout()
      .pipe(finalize(() => this.loggingOut.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/auth/login');
        },
        error: () => {
          void this.router.navigateByUrl('/auth/login');
        }
      });
  }
}
