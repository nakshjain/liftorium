package com.gymhelper.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;

public final class AuthDtos {

  private AuthDtos() {
  }

  public record RegisterRequest(
      @NotBlank @Email @Size(max = 320) String email,
      @NotBlank @Size(min = 8, max = 128) String password,
      @NotBlank @Size(max = 80) String displayName
  ) {
  }

  public record LoginRequest(
      @NotBlank @Email @Size(max = 320) String email,
      @NotBlank @Size(max = 128) String password
  ) {
  }

  public record AuthUserDto(
      String id,
      String email,
      String displayName
  ) {
  }

  public record AuthSession(
      AuthUserDto user,
      String accessToken,
      String refreshToken
  ) {
  }

  public record AuthPayload(
      AuthUserDto user,
      String accessToken
  ) {
  }

  public static Map<String, Object> sessionData(AuthSession session) {
    return Map.of(
        "user", session.user(),
        "accessToken", session.accessToken()
    );
  }
}
