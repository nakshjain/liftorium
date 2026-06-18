import { Injectable, computed, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';
import type { UserSettings, WeightUnit, DistanceUnit, AppTheme } from './settings.models';

const STORAGE_KEY = 'liftorium_settings';

/**
 * Global singleton store for user settings.
 *
 * Startup flow:
 *   1. Read localStorage → populate signals immediately (no flicker)
 *   2. load() called after login → fetch from API → update signals + localStorage
 *
 * All weight/unit consumers inject this store and read weightUnit().
 */
@Injectable({ providedIn: 'root' })
export class UserSettingsStore {
  private readonly settingsService = inject(SettingsService);

  private readonly _settings = signal<UserSettings | null>(this.loadFromStorage());

  // ── Public read-only signals ──────────────────────────────────────────────

  readonly settings = this._settings.asReadonly();

  readonly weightUnit = computed<WeightUnit>(
    () => this._settings()?.units.weight ?? 'kg'
  );

  readonly distanceUnit = computed<DistanceUnit>(
    () => this._settings()?.units.distance ?? 'km'
  );

  readonly theme = computed<AppTheme>(
    () => this._settings()?.appearance.theme ?? 'dark'
  );

  readonly defaultRestSeconds = computed<number>(
    () => this._settings()?.workout.defaultRestSeconds ?? 90
  );

  readonly autoStartRestTimer = computed<boolean>(
    () => this._settings()?.workout.autoStartRestTimer ?? true
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Fetches the latest settings from the API and updates the store.
   * Call this after a successful login / session restore.
   */
  load(): void {
    this.settingsService.getSettings().subscribe({
      next: (s) => this.applySettings(s),
      error: () => { /* keep localStorage values on network failure */ },
    });
  }

  /**
   * Clears the in-memory and persisted settings.
   * Call this on logout so the next user starts with a clean slate.
   */
  clear(): void {
    this._settings.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }

  /**
   * Applies a settings update optimistically:
   * updates the signal + localStorage immediately, then persists to the API.
   */
  update(patch: Partial<UserSettings>): void {
    const current = this._settings();
    if (!current) return;

    const merged: UserSettings = {
      ...current,
      units:      patch.units      ?? current.units,
      workout:    patch.workout    ?? current.workout,
      appearance: patch.appearance ?? current.appearance,
    };

    this.applySettings(merged);

    this.settingsService.updateSettings({
      units:      merged.units,
      workout:    merged.workout,
      appearance: merged.appearance,
    }).subscribe({
      next: (saved) => this.applySettings(saved),
      error: () => {
        // Rollback on failure
        this.applySettings(current);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private applySettings(s: UserSettings): void {
    this._settings.set(s);
    this.persistToStorage(s);
  }

  private loadFromStorage(): UserSettings | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserSettings) : null;
    } catch {
      return null;
    }
  }

  private persistToStorage(s: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch { /* storage quota exceeded — non-fatal */ }
  }
}
