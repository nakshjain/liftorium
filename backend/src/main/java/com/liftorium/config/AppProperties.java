package com.liftorium.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
    Cors cors,
    Jwt jwt,
    Exercises exercises,
    Otp otp,
    Security security
) {

  public record Cors(
      @NotBlank String allowedOrigin
  ) {
  }

  public record Jwt(
      @NotBlank String accessSecret,
      @NotBlank String refreshSecret,
      @NotBlank String accessTokenTtl,
      @NotBlank String refreshTokenTtl,
      @NotBlank String refreshTokenCookieName,
      @NotBlank String refreshTokenCookiePath
  ) {
  }

  public record Exercises(
      boolean syncOnStartup
  ) {
  }

  public record Otp(
      int expiryMinutes,
      int maxAttemptsPerWindow,
      int rateLimitWindowMinutes
  ) {
  }

  public record Security(
      @Min(4) @Max(31) int bcryptStrength
  ) {
  }
}
