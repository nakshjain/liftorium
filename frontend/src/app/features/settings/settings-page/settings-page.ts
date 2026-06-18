import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { NavBarComponent } from '../../../shared/ui/nav-bar/nav-bar';
import { SettingsService } from '../settings.service';
import type {
  AppTheme,
  DistanceUnit,
  UpdateSettingsRequest,
  UserSettings,
  WeightUnit,
} from '../settings.models';

type Section = 'account' | 'workout' | 'appearance' | 'security' | 'data';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, NavBarComponent],
  templateUrl: './settings-page.html',
})
export class SettingsPageComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly user = this.authService.user;
  protected readonly activeSection = signal<Section>('account');

  // ── Loading / saving state (signals for reliable CD) ─────────────────
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly accountSaving = signal(false);
  protected readonly passwordSaving = signal(false);
  protected readonly deleting = signal(false);
  protected readonly settings = signal<UserSettings | null>(null);

  // ── Account form ─────────────────────────────────────────────────────
  protected displayName = '';

  // ── Workout prefs form ───────────────────────────────────────────────
  protected weightUnit: WeightUnit = 'kg';
  protected distanceUnit: DistanceUnit = 'km';
  protected defaultRestSeconds = 90;
  protected autoStartRestTimer = true;

  // ── Appearance form ──────────────────────────────────────────────────
  protected theme: AppTheme = 'dark';

  // ── Security form ────────────────────────────────────────────────────
  protected currentPassword = '';
  protected newPassword = '';
  protected confirmPassword = '';
  protected showCurrentPassword = false;
  protected showNewPassword = false;
  protected showConfirmPassword = false;

  // ── Delete account ───────────────────────────────────────────────────
  protected deleteConfirmText = '';

  protected readonly canDelete = computed(() => this.deleteConfirmText === 'DELETE');

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe({
      next: (s) => {
        this.settings.set(s);
        this.populateForms(s);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load settings');
        this.loading.set(false);
      },
    });

    const u = this.authService.user();
    if (u) this.displayName = u.displayName;
  }

  // ── Navigation ────────────────────────────────────────────────────────

  protected setSection(section: string): void {
    this.activeSection.set(section as Section);
  }

  protected setWeightUnit(value: string): void {
    this.weightUnit = value as WeightUnit;
  }

  protected setDistanceUnit(value: string): void {
    this.distanceUnit = value as DistanceUnit;
  }

  protected setTheme(value: string): void {
    this.theme = value as AppTheme;
  }

  // ── Account ───────────────────────────────────────────────────────────

  protected saveAccount(): void {
    if (!this.displayName.trim()) return;
    this.accountSaving.set(true);
    this.settingsService.updateAccount({ displayName: this.displayName.trim() }).subscribe({
      next: () => {
        this.toastService.success('Name updated');
        this.accountSaving.set(false);
      },
      error: (err) => {
        this.toastService.error(err?.error?.error?.message ?? 'Failed to update name');
        this.accountSaving.set(false);
      },
    });
  }

  // ── Workout prefs ─────────────────────────────────────────────────────

  protected saveWorkoutPrefs(): void {
    const request: UpdateSettingsRequest = {
      units: { weight: this.weightUnit, distance: this.distanceUnit },
      workout: {
        defaultRestSeconds: Number(this.defaultRestSeconds),
        autoStartRestTimer: this.autoStartRestTimer,
      },
    };
    this.saving.set(true);
    this.settingsService.updateSettings(request).subscribe({
      next: (s) => {
        this.settings.set(s);
        this.toastService.success('Workout preferences saved');
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err?.error?.error?.message ?? 'Failed to save preferences');
        this.saving.set(false);
      },
    });
  }

  // ── Appearance ────────────────────────────────────────────────────────

  protected saveAppearance(): void {
    const request: UpdateSettingsRequest = { appearance: { theme: this.theme } };
    this.saving.set(true);
    this.settingsService.updateSettings(request).subscribe({
      next: (s) => {
        this.settings.set(s);
        this.toastService.success('Appearance saved');
        this.saving.set(false);
      },
      error: (err) => {
        this.toastService.error(err?.error?.error?.message ?? 'Failed to save appearance');
        this.saving.set(false);
      },
    });
  }

  // ── Security ──────────────────────────────────────────────────────────

  protected get passwordMismatch(): boolean {
    return (
      this.newPassword.length > 0 &&
      this.confirmPassword.length > 0 &&
      this.newPassword !== this.confirmPassword
    );
  }

  protected get canChangePassword(): boolean {
    return (
      this.currentPassword.length > 0 &&
      this.newPassword.length >= 8 &&
      this.newPassword === this.confirmPassword
    );
  }

  protected savePassword(): void {
    if (!this.canChangePassword) return;
    this.passwordSaving.set(true);
    this.settingsService
      .changePassword({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
      })
      .subscribe({
        next: () => {
          this.toastService.success('Password changed successfully');
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.passwordSaving.set(false);
        },
        error: (err) => {
          this.toastService.error(err?.error?.error?.message ?? 'Failed to change password');
          this.passwordSaving.set(false);
        },
      });
  }

  // ── Delete account ────────────────────────────────────────────────────

  protected confirmDelete(): void {
    if (!this.canDelete()) return;
    this.deleting.set(true);
    this.settingsService.deleteAccount().subscribe({
      next: () => {
        this.router.navigate(['/app']);
      },
      error: (err) => {
        this.toastService.error(err?.error?.error?.message ?? 'Failed to delete account');
        this.deleting.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private populateForms(s: UserSettings): void {
    this.weightUnit = s.units.weight;
    this.distanceUnit = s.units.distance;
    this.defaultRestSeconds = s.workout.defaultRestSeconds;
    this.autoStartRestTimer = s.workout.autoStartRestTimer;
    this.theme = s.appearance.theme;
  }
}
