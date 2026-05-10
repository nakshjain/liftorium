package com.gymhelper.service;

import com.gymhelper.config.AppProperties;
import com.gymhelper.dto.AuthDtos.AuthSession;
import com.gymhelper.dto.AuthDtos.AuthUserDto;
import com.gymhelper.dto.AuthDtos.LoginRequest;
import com.gymhelper.dto.AuthDtos.RegisterRequest;
import com.gymhelper.entity.RefreshToken;
import com.gymhelper.entity.User;
import com.gymhelper.exception.AppException;
import com.gymhelper.repository.RefreshTokenRepository;
import com.gymhelper.repository.UserRepository;
import io.jsonwebtoken.Claims;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final AppProperties appProperties;

  public AuthSession register(RegisterRequest input) {
    String email = normalizeEmail(input.email());

    if (userRepository.existsByEmail(email)) {
      throw new AppException("EMAIL_ALREADY_REGISTERED", "Email is already registered", HttpStatus.CONFLICT);
    }

    User user = User.builder()
        .email(email)
        .displayName(input.displayName().trim())
        .passwordHash(passwordEncoder.encode(input.password()))
        .build();

    return createSession(userRepository.save(user));
  }

  public AuthSession login(LoginRequest input) {
    String email = normalizeEmail(input.email());
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new AppException("INVALID_CREDENTIALS", "Invalid email or password", HttpStatus.UNAUTHORIZED));

    if (!passwordEncoder.matches(input.password(), user.getPasswordHash())) {
      throw new AppException("INVALID_CREDENTIALS", "Invalid email or password", HttpStatus.UNAUTHORIZED);
    }

    return createSession(user);
  }

  public AuthSession refresh(String refreshToken) {
    Claims claims = jwtService.verifyRefreshToken(refreshToken);
    String tokenHash = hashRefreshToken(refreshToken);

    RefreshToken persistedToken = refreshTokenRepository
        .findByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(tokenHash, Instant.now())
        .orElseThrow(() -> new AppException("INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired", HttpStatus.UNAUTHORIZED));

    String tokenId = claims.get("tokenId", String.class);
    if (!persistedToken.getId().equals(tokenId)) {
      throw new AppException("INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired", HttpStatus.UNAUTHORIZED);
    }

    persistedToken.setRevokedAt(Instant.now());
    refreshTokenRepository.save(persistedToken);

    User user = userRepository.findById(claims.getSubject())
        .orElseThrow(() -> new AppException("INVALID_REFRESH_TOKEN", "Refresh token user no longer exists", HttpStatus.UNAUTHORIZED));

    return createSession(user);
  }

  public void logout(String refreshToken) {
    String tokenHash = hashRefreshToken(refreshToken);
    refreshTokenRepository.findByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(tokenHash, Instant.now())
        .ifPresent(token -> {
          token.setRevokedAt(Instant.now());
          refreshTokenRepository.save(token);
        });
  }

  public AuthUserDto toUserDto(User user) {
    return new AuthUserDto(user.getId(), user.getEmail(), user.getDisplayName());
  }

  private AuthSession createSession(User user) {
    AuthUserDto userDto = toUserDto(user);
    String accessToken = jwtService.signAccessToken(userDto);

    RefreshToken record = refreshTokenRepository.save(RefreshToken.builder()
        .userId(user.getId())
        .tokenHash("pending")
        .expiresAt(Instant.now().plus(jwtService.getRefreshTokenTtl()))
        .build());

    String refreshToken = jwtService.signRefreshToken(user.getId(), record.getId());
    record.setTokenHash(hashRefreshToken(refreshToken));
    refreshTokenRepository.save(record);

    return new AuthSession(userDto, accessToken, refreshToken);
  }

  private String normalizeEmail(String email) {
    return email.trim().toLowerCase();
  }

  private String hashRefreshToken(String refreshToken) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      SecretKeySpec keySpec = new SecretKeySpec(
          appProperties.jwt().refreshSecret().getBytes(StandardCharsets.UTF_8),
          "HmacSHA256"
      );
      mac.init(keySpec);
      return bytesToHex(mac.doFinal(refreshToken.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception exception) {
      throw new AppException("TOKEN_HASH_FAILED", "Refresh token could not be processed", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private String bytesToHex(byte[] bytes) {
    StringBuilder builder = new StringBuilder(bytes.length * 2);
    for (byte value : bytes) {
      builder.append(String.format("%02x", value));
    }
    return builder.toString();
  }
}
