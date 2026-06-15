package com.liftorium.controller;

import com.liftorium.config.AppProperties;
import com.liftorium.dto.ApiResponse;
import com.liftorium.dto.AuthDtos;
import com.liftorium.dto.AuthDtos.AuthSession;
import com.liftorium.dto.AuthDtos.AuthUserDto;
import com.liftorium.dto.AuthDtos.ForgotPasswordRequest;
import com.liftorium.dto.AuthDtos.LoginRequest;
import com.liftorium.dto.AuthDtos.RegisterInitiateRequest;
import com.liftorium.dto.AuthDtos.RegisterRequest;
import com.liftorium.dto.AuthDtos.RegisterVerifyRequest;
import com.liftorium.dto.AuthDtos.ResetPasswordRequest;
import com.liftorium.exception.AppException;
import com.liftorium.security.UserPrincipal;
import com.liftorium.service.AuthService;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;
  private final AppProperties appProperties;
  private final Environment environment;

  @PostMapping("/register/initiate")
  public ApiResponse<Map<String, String>> registerInitiate(@Valid @RequestBody RegisterInitiateRequest request) {
    authService.initiateRegistration(request);
    return ApiResponse.success(Map.of("message", "Verification code sent to your email"));
  }

  @PostMapping("/register/verify")
  public ResponseEntity<ApiResponse<Map<String, Object>>> registerVerify(@Valid @RequestBody RegisterVerifyRequest request) {
    AuthSession session = authService.verifyRegistration(request);
    return sendSession(session, HttpStatus.CREATED);
  }

  @PostMapping("/register")
  public ResponseEntity<ApiResponse<Map<String, Object>>> register(@Valid @RequestBody RegisterRequest request) {
    AuthSession session = authService.register(request);
    return sendSession(session, HttpStatus.CREATED);
  }

  @PostMapping("/login")
  public ResponseEntity<ApiResponse<Map<String, Object>>> login(@Valid @RequestBody LoginRequest request) {
    AuthSession session = authService.login(request);
    return sendSession(session, HttpStatus.OK);
  }

  @PostMapping("/refresh")
  public ResponseEntity<ApiResponse<Map<String, Object>>> refresh(
      @CookieValue(name = "${app.jwt.refresh-token-cookie-name}", required = false) String refreshToken
  ) {
    AuthSession session = authService.refresh(requireRefreshToken(refreshToken));
    return sendSession(session, HttpStatus.OK);
  }

  @GetMapping("/me")
  public ApiResponse<Map<String, AuthUserDto>> me(@AuthenticationPrincipal UserPrincipal principal) {
    AuthUserDto user = new AuthUserDto(principal.getId(), principal.getEmail(), principal.getDisplayName());
    return ApiResponse.success(Map.of("user", user));
  }

  @PostMapping("/forgot-password")
  public ApiResponse<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    authService.initiateForgotPassword(request);
    return ApiResponse.success(Map.of("message", "If that email is registered, a reset code is on its way"));
  }

  @PostMapping("/forgot-password/reset")
  public ResponseEntity<ApiResponse<Map<String, Object>>> forgotPasswordReset(@Valid @RequestBody ResetPasswordRequest request) {
    AuthSession session = authService.resetPassword(request);
    return sendSession(session, HttpStatus.OK);
  }

  @PostMapping("/logout")
  public ResponseEntity<ApiResponse<Map<String, Boolean>>> logout(
      @CookieValue(name = "${app.jwt.refresh-token-cookie-name}", required = false) String refreshToken
  ) {
    authService.logout(requireRefreshToken(refreshToken));

    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO).toString())
        .body(ApiResponse.success(Map.of("loggedOut", true)));
  }

  private ResponseEntity<ApiResponse<Map<String, Object>>> sendSession(AuthSession session, HttpStatus status) {
    return ResponseEntity
        .status(status)
        .header(HttpHeaders.SET_COOKIE, refreshCookie(session.refreshToken(), null).toString())
        .body(ApiResponse.success(AuthDtos.sessionData(session)));
  }

  private ResponseCookie refreshCookie(String value, Duration maxAge) {
    ResponseCookie.ResponseCookieBuilder builder = ResponseCookie
        .from(appProperties.jwt().refreshTokenCookieName(), value)
        .httpOnly(true)
        .secure(isProduction())
        .sameSite("Strict")
        .path(appProperties.jwt().refreshTokenCookiePath());

    if (maxAge != null) {
      builder.maxAge(maxAge);
    }

    return builder.build();
  }

  private boolean isProduction() {
    for (String profile : environment.getActiveProfiles()) {
      if ("production".equals(profile)) {
        return true;
      }
    }
    return false;
  }

  private String requireRefreshToken(String refreshToken) {
    if (refreshToken == null || refreshToken.isBlank()) {
      throw new AppException("REFRESH_TOKEN_REQUIRED", "Refresh token cookie is missing", HttpStatus.UNAUTHORIZED);
    }
    return refreshToken;
  }
}
