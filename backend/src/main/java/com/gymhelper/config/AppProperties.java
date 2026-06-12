package com.gymhelper.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
    Cors cors,
    Jwt jwt,
    Exercises exercises
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
}
