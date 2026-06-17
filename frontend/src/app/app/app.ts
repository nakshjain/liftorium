import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { AuthGateService } from '../core/auth/auth-gate.service';
import { ToastContainerComponent } from '../shared/ui/toast/toast-container';
import { AuthGateModalComponent } from '../shared/ui/auth-gate-modal/auth-gate-modal';
import { WorkoutSyncService } from '../features/workouts/workout-sync.service';
import { WorkoutSyncModalComponent } from '../features/workouts/workout-sync-modal/workout-sync-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, AuthGateModalComponent, WorkoutSyncModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly authService = inject(AuthService);
  protected readonly authGateService = inject(AuthGateService);
  protected readonly syncService = inject(WorkoutSyncService);

  public ngOnInit(): void {
    this.authService.initializeSession();
  }
}
