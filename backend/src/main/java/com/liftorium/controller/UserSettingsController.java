package com.liftorium.controller;

import com.liftorium.dto.ApiResponse;
import com.liftorium.dto.AuthDtos.AuthUserDto;
import com.liftorium.dto.UserSettingsDtos.ChangePasswordRequest;
import com.liftorium.dto.UserSettingsDtos.UpdateAccountRequest;
import com.liftorium.dto.UserSettingsDtos.UpdateSettingsRequest;
import com.liftorium.dto.UserSettingsDtos.UserSettingsDto;
import com.liftorium.entity.User;
import com.liftorium.security.UserPrincipal;
import com.liftorium.service.UserSettingsService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class UserSettingsController {

  private final UserSettingsService userSettingsService;

  /**
   * GET /api/v1/settings
   * Returns the authenticated user's settings, creating defaults if needed.
   */
  @GetMapping
  public ApiResponse<Map<String, UserSettingsDto>> getSettings(
      @AuthenticationPrincipal UserPrincipal principal
  ) {
    return ApiResponse.success(Map.of("settings", userSettingsService.getOrCreate(principal.getId())));
  }

  /**
   * PUT /api/v1/settings
   * Replaces the authenticated user's settings with the provided payload.
   */
  @PutMapping
  public ApiResponse<Map<String, UserSettingsDto>> updateSettings(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody UpdateSettingsRequest request
  ) {
    return ApiResponse.success(Map.of("settings", userSettingsService.update(principal.getId(), request)));
  }

  /**
   * PUT /api/v1/settings/account
   * Updates the user's display name.
   */
  @PutMapping("/account")
  public ApiResponse<Map<String, AuthUserDto>> updateAccount(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody UpdateAccountRequest request
  ) {
    User updated = userSettingsService.updateAccount(principal.getId(), request);
    AuthUserDto userDto = new AuthUserDto(updated.getId(), updated.getEmail(), updated.getDisplayName());
    return ApiResponse.success(Map.of("user", userDto));
  }

  /**
   * PUT /api/v1/settings/security/password
   * Changes the authenticated user's password after verifying the current one.
   */
  @PutMapping("/security/password")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void changePassword(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody ChangePasswordRequest request
  ) {
    userSettingsService.changePassword(principal.getId(), request);
  }

  /**
   * DELETE /api/v1/settings/account
   * Permanently deletes the authenticated user's account and all settings.
   */
  @DeleteMapping("/account")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteAccount(
      @AuthenticationPrincipal UserPrincipal principal
  ) {
    userSettingsService.deleteAccount(principal.getId());
  }
}
