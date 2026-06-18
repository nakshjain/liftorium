export type WeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'km' | 'mi';
export type AppTheme = 'dark' | 'system';

export type UnitsSettings = {
  weight: WeightUnit;
  distance: DistanceUnit;
};

export type WorkoutPrefs = {
  defaultRestSeconds: number;
  autoStartRestTimer: boolean;
};

export type AppearanceSettings = {
  theme: AppTheme;
};

export type UserSettings = {
  id: string;
  userId: string;
  units: UnitsSettings;
  workout: WorkoutPrefs;
  appearance: AppearanceSettings;
};

// ── Request types ─────────────────────────────────────────────────────────────

export type UpdateSettingsRequest = {
  units?: UnitsSettings;
  workout?: WorkoutPrefs;
  appearance?: AppearanceSettings;
};

export type UpdateAccountRequest = {
  displayName: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};
