package com.liftorium.service;

import com.liftorium.dto.UserSettingsDtos.AppearanceDto;
import com.liftorium.dto.UserSettingsDtos.ChangePasswordRequest;
import com.liftorium.dto.UserSettingsDtos.UnitsDto;
import com.liftorium.dto.UserSettingsDtos.UpdateAccountRequest;
import com.liftorium.dto.UserSettingsDtos.UpdateSettingsRequest;
import com.liftorium.dto.UserSettingsDtos.UserSettingsDto;
import com.liftorium.dto.UserSettingsDtos.WorkoutPrefsDto;
import com.liftorium.entity.User;
import com.liftorium.entity.UserSettings;
import com.liftorium.entity.UserSettings.AppearanceSettings;
import com.liftorium.entity.UserSettings.UnitsSettings;
import com.liftorium.entity.UserSettings.WorkoutSettings;
import com.liftorium.exception.AppException;
import com.liftorium.repository.UserRepository;
import com.liftorium.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserSettingsService {

  private final UserSettingsRepository userSettingsRepository;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  // ── Settings CRUD ─────────────────────────────────────────────────────

  /**
   * Returns the settings document for the given user, creating a default one
   * if none exists (idempotent — safe to call multiple times).
   */
  public UserSettingsDto getOrCreate(String userId) {
    UserSettings settings = userSettingsRepository.findByUserId(userId)
        .orElseGet(() -> {
          log.info("No settings found for userId={}, creating defaults", userId);
          return userSettingsRepository.save(UserSettings.createDefaults(userId));
        });
    return toDto(settings);
  }

  /**
   * Applies a full settings update. All three sections (units, workout,
   * appearance) are replaced atomically. Any section that is null in the
   * request is left unchanged.
   */
  public UserSettingsDto update(String userId, UpdateSettingsRequest request) {
    UserSettings settings = userSettingsRepository.findByUserId(userId)
        .orElseGet(() -> userSettingsRepository.save(UserSettings.createDefaults(userId)));

    if (request.units() != null) {
      settings.setUnits(UnitsSettings.builder()
          .weight(request.units().weight())
          .distance(request.units().distance())
          .build());
    }

    if (request.workout() != null) {
      settings.setWorkout(WorkoutSettings.builder()
          .defaultRestSeconds(request.workout().defaultRestSeconds())
          .autoStartRestTimer(request.workout().autoStartRestTimer())
          .build());
    }

    if (request.appearance() != null) {
      settings.setAppearance(AppearanceSettings.builder()
          .theme(request.appearance().theme())
          .build());
    }

    return toDto(userSettingsRepository.save(settings));
  }

  /**
   * Creates a default settings document for a newly registered user.
   * No-ops if one already exists (duplicate-safe).
   */
  public void createDefaults(String userId) {
    if (!userSettingsRepository.existsByUserId(userId)) {
      userSettingsRepository.save(UserSettings.createDefaults(userId));
      log.info("Default settings created for userId={}", userId);
    }
  }

  // ── Account mutations ─────────────────────────────────────────────────

  public User updateAccount(String userId, UpdateAccountRequest request) {
    User user = requireUser(userId);
    user.setDisplayName(request.displayName().trim());
    User saved = userRepository.save(user);
    log.info("Display name updated for userId={}", userId);
    return saved;
  }

  public void changePassword(String userId, ChangePasswordRequest request) {
    User user = requireUser(userId);

    if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
      throw new AppException("INVALID_CREDENTIALS", "Current password is incorrect", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (request.currentPassword().equals(request.newPassword())) {
      throw new AppException(
          "PASSWORD_SAME_AS_CURRENT",
          "New password must be different from your current password",
          HttpStatus.UNPROCESSABLE_ENTITY
      );
    }

    user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    userRepository.save(user);
    log.info("Password changed for userId={}", userId);
  }

  public void deleteAccount(String userId) {
    requireUser(userId);
    userSettingsRepository.deleteByUserId(userId);
    userRepository.deleteById(userId);
    log.info("Account deleted for userId={}", userId);
  }

  // ── Mapping ───────────────────────────────────────────────────────────

  public UserSettingsDto toDto(UserSettings settings) {
    UnitsSettings u = settings.getUnits();
    WorkoutSettings w = settings.getWorkout();
    AppearanceSettings a = settings.getAppearance();

    return new UserSettingsDto(
        settings.getId(),
        settings.getUserId(),
        new UnitsDto(u.getWeight(), u.getDistance()),
        new WorkoutPrefsDto(w.getDefaultRestSeconds(), w.isAutoStartRestTimer()),
        new AppearanceDto(a.getTheme())
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private User requireUser(String userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new AppException("USER_NOT_FOUND", "User not found", HttpStatus.NOT_FOUND));
  }
}
