package com.liftorium.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public final class UserSettingsDtos {

  private UserSettingsDtos() {
  }

  // ── Response ─────────────────────────────────────────────────────────

  public record UserSettingsDto(
      String id,
      String userId,
      UnitsDto units,
      WorkoutPrefsDto workout,
      AppearanceDto appearance
  ) {
  }

  public record UnitsDto(
      String weight,
      String distance
  ) {
  }

  public record WorkoutPrefsDto(
      int defaultRestSeconds,
      boolean autoStartRestTimer
  ) {
  }

  public record AppearanceDto(
      String theme
  ) {
  }

  // ── Update request ────────────────────────────────────────────────────

  public record UpdateSettingsRequest(
      @Valid UpdateUnitsRequest units,
      @Valid UpdateWorkoutPrefsRequest workout,
      @Valid UpdateAppearanceRequest appearance
  ) {
  }

  public record UpdateUnitsRequest(
      @NotBlank
      @Pattern(regexp = "^(kg|lb)$", message = "weight unit must be 'kg' or 'lb'")
      String weight,

      @NotBlank
      @Pattern(regexp = "^(km|mi)$", message = "distance unit must be 'km' or 'mi'")
      String distance
  ) {
  }

  public record UpdateWorkoutPrefsRequest(
      @NotNull
      @Min(value = 0, message = "defaultRestSeconds must be at least 0")
      @Max(value = 600, message = "defaultRestSeconds must be at most 600")
      Integer defaultRestSeconds,

      @NotNull
      Boolean autoStartRestTimer
  ) {
  }

  public record UpdateAppearanceRequest(
      @NotBlank
      @Pattern(regexp = "^(dark|system)$", message = "theme must be 'dark' or 'system'")
      String theme
  ) {
  }

  // ── Account update request ────────────────────────────────────────────

  public record UpdateAccountRequest(
      @NotBlank(message = "displayName must not be blank")
      @jakarta.validation.constraints.Size(min = 1, max = 80, message = "displayName must be between 1 and 80 characters")
      String displayName
  ) {
  }

  // ── Change password request ───────────────────────────────────────────

  public record ChangePasswordRequest(
      @NotBlank(message = "currentPassword must not be blank")
      String currentPassword,

      @NotBlank(message = "newPassword must not be blank")
      @jakarta.validation.constraints.Size(min = 8, max = 128, message = "newPassword must be between 8 and 128 characters")
      String newPassword
  ) {
  }
}
