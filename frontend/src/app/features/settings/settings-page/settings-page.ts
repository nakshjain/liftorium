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
import { ConfirmationDialogComponent } from '../../../shared/ui/confirmation-dialog/confirmation-dialog';
import { SettingsService } from '../settings.service';
import { UserSettingsStore } from '../settings.store';
import type {
  AppTheme,
  DistanceUnit,
  UserSettings,
  WeightUnit,
} from '../settings.models';

type Section = 'account' | 'workout' | 'appearance' | 'security' | 'data';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, NavBarComponent, ConfirmationDialogComponent],
  templateUrl: './settings-page.html',
})
export class SettingsPageComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly settingsStore = inject(UserSettingsStore);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly user = this.authService.user;
  protected readonly activeSection = signal<Section>('account');

  /** Tab definitions — used by both the tab bar and aria attributes. */
  protected readonly tabs: { id: Section; label: string }[] = [
    { id: 'account',    label: 'Account'    },
    { id: 'workout',    label: 'Workout'    },
    { id: 'appearance', label: 'Appearance' },
    { id: 'security',   label: 'Security'   },
    { id: 'data',       label: 'Data'       },
  ];

  // ── Loading / saving state ────────────────────────────────────────────
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly accountSaving = signal(false);
  protected readonly passwordSaving = signal(false);
  protected readonly deleting = signal(false);

  // ── Dirty-state guard ─────────────────────────────────────────────────
  /** True when the active section has unsaved changes. */
  private readonly isDirty = signal(false);
  /** Controls the "unsaved changes" confirmation dialog. */
  protected readonly showDirtyConfirm = signal(false);
  /** The section the user wants to navigate to after confirming. */
  private pendingSection: Section | null = null;

  protected markDirty(): void { this.isDirty.set(true); }

  protected setSection(section: string): void {
    const target = section as Section;
    if (target === this.activeSection()) return;
    if (this.isDirty()) {
      this.pendingSection = target;
      this.showDirtyConfirm.set(true);
      return;
    }
    this.activeSection.set(target);
  }

  protected confirmLeave(): void {
    this.showDirtyConfirm.set(false);
    this.isDirty.set(false);
    if (this.pendingSection) {
      this.activeSection.set(this.pendingSection);
      this.pendingSection = null;
    }
  }

  protected cancelLeave(): void {
    this.showDirtyConfirm.set(false);
    this.pendingSection = null;
  }

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

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Seed from store cache immediately — no flicker even before API returns
    const cached = this.settingsStore.settings();
    if (cached) {
      this.populateForms(cached);
      this.loading.set(false);
    }

    this.settingsService.getSettings().subscribe({
      next: (s) => {
        this.populateForms(s);
        this.loading.set(false);
      },
      error: () => {
        if (!cached) this.toastService.error('Failed to load settings');
        this.loading.set(false);
      },
    });

    const u = this.authService.user();
    if (u) this.displayName = u.displayName;
  }

  // ── Unit / theme setters (also mark dirty) ────────────────────────────

  protected setWeightUnit(value: string): void {
    this.weightUnit = value as WeightUnit;
    this.markDirty();
  }

  protected setDistanceUnit(value: string): void {
    this.distanceUnit = value as DistanceUnit;
    this.markDirty();
  }

  protected setTheme(value: string): void {
    this.theme = value as AppTheme;
    this.markDirty();
  }

  // ── Account ───────────────────────────────────────────────────────────

  protected saveAccount(): void {
    if (!this.displayName.trim()) return;
    this.accountSaving.set(true);
    this.settingsService.updateAccount({ displayName: this.displayName.trim() }).subscribe({
      next: () => {
        this.toastService.success('Name updated');
        this.isDirty.set(false);
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
    this.saving.set(true);
    this.settingsStore.update({
      units:   { weight: this.weightUnit, distance: this.distanceUnit },
      workout: {
        defaultRestSeconds: Number(this.defaultRestSeconds),
        autoStartRestTimer: this.autoStartRestTimer,
      },
    });
    this.toastService.success('Workout preferences saved');
    this.isDirty.set(false);
    this.saving.set(false);
  }

  // ── Appearance ────────────────────────────────────────────────────────

  protected saveAppearance(): void {
    this.saving.set(true);
    this.settingsStore.update({ appearance: { theme: this.theme } });
    this.toastService.success('Appearance saved');
    this.isDirty.set(false);
    this.saving.set(false);
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
          this.isDirty.set(false);
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
    this.weightUnit         = s.units.weight;
    this.distanceUnit       = s.units.distance;
    this.defaultRestSeconds = s.workout.defaultRestSeconds;
    this.autoStartRestTimer = s.workout.autoStartRestTimer;
    this.theme              = s.appearance.theme;
  }
}
