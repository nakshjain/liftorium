package com.liftorium.service;

import com.liftorium.config.AppProperties;
import com.liftorium.dto.AuthDtos.AuthSession;
import com.liftorium.dto.AuthDtos.AuthUserDto;
import com.liftorium.dto.AuthDtos.ForgotPasswordRequest;
import com.liftorium.dto.AuthDtos.LoginRequest;
import com.liftorium.dto.AuthDtos.RegisterInitiateRequest;
import com.liftorium.dto.AuthDtos.RegisterRequest;
import com.liftorium.dto.AuthDtos.RegisterVerifyRequest;
import com.liftorium.dto.AuthDtos.ResetPasswordRequest;
import com.liftorium.entity.PasswordResetRequest;
import com.liftorium.entity.PendingRegistration;
import com.liftorium.entity.RefreshToken;
import com.liftorium.entity.User;
import com.liftorium.exception.AppException;
import com.liftorium.repository.PasswordResetRequestRepository;
import com.liftorium.repository.PendingRegistrationRepository;
import com.liftorium.repository.RefreshTokenRepository;
import com.liftorium.repository.UserRepository;
import io.jsonwebtoken.Claims;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final PendingRegistrationRepository pendingRegistrationRepository;
  private final PasswordResetRequestRepository passwordResetRequestRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final OtpService otpService;
  private final EmailService emailService;
  private final AppProperties appProperties;

  public void initiateRegistration(RegisterInitiateRequest input) {
    String email = normalizeEmail(input.email());
    log.info("Registration initiation requested for email: {}", email);

    if (userRepository.existsByEmail(email)) {
      log.warn("Registration initiation failed - email already registered: {}", email);
      throw new AppException("EMAIL_ALREADY_REGISTERED", "Email is already registered", HttpStatus.CONFLICT);
    }

    PendingRegistration pending = pendingRegistrationRepository.findByEmail(email)
        .orElse(PendingRegistration.builder().email(email).attemptCount(0).build());

    Instant rateLimitWindow = Instant.now().minus(
        appProperties.otp().rateLimitWindowMinutes(), ChronoUnit.MINUTES);
    if (pending.getLastAttemptAt() != null
        && pending.getLastAttemptAt().isAfter(rateLimitWindow)
        && pending.getAttemptCount() >= appProperties.otp().maxAttemptsPerWindow()) {
      log.warn("Registration initiation rate limited for email: {}. Attempts: {}", email, pending.getAttemptCount());
      throw new AppException("OTP_RATE_LIMITED", "Too many attempts. Please try again later.", HttpStatus.TOO_MANY_REQUESTS);
    }

    if (pending.getLastAttemptAt() == null || pending.getLastAttemptAt().isBefore(rateLimitWindow)) {
      pending.setAttemptCount(0);
      log.debug("Reset attempt count for email: {}", email);
    }

    String otp = otpService.generateOtp();

    pending.setDisplayName(input.displayName().trim());
    pending.setPasswordHash(passwordEncoder.encode(input.password()));
    pending.setOtpHash(otpService.hashOtp(otp));
    pending.setAttemptCount(pending.getAttemptCount() + 1);
    pending.setLastAttemptAt(Instant.now());
    pending.setExpiresAt(Instant.now().plus(appProperties.otp().expiryMinutes(), ChronoUnit.MINUTES));

    pendingRegistrationRepository.save(pending);
    log.info("Pending registration saved for email: {}. Attempt count: {}", email, pending.getAttemptCount());

    emailService.sendOtp(email, otp);
  }

  public AuthSession verifyRegistration(RegisterVerifyRequest input) {
    String email = normalizeEmail(input.email());
    log.info("Registration verification requested for email: {}", email);

    PendingRegistration pending = pendingRegistrationRepository.findByEmail(email)
        .orElseThrow(() -> {
          log.warn("Registration verification failed - no pending registration found for email: {}", email);
          return new AppException("OTP_EXPIRED", "Verification code has expired. Please request a new one.", HttpStatus.BAD_REQUEST);
        });

    if (!otpService.verifyOtp(input.otp(), pending.getOtpHash())) {
      log.warn("Registration verification failed - invalid OTP for email: {}", email);
      throw new AppException("OTP_INVALID", "Invalid verification code", HttpStatus.BAD_REQUEST);
    }

    if (userRepository.existsByEmail(email)) {
      log.warn("Registration verification failed - email already registered: {}", email);
      pendingRegistrationRepository.deleteByEmail(email);
      throw new AppException("EMAIL_ALREADY_REGISTERED", "Email is already registered", HttpStatus.CONFLICT);
    }

    User user = User.builder()
        .email(email)
        .displayName(pending.getDisplayName())
        .passwordHash(pending.getPasswordHash())
        .build();

    User savedUser = userRepository.save(user);
    log.info("User created successfully via OTP verification. User ID: {}, Email: {}", savedUser.getId(), email);

    pendingRegistrationRepository.deleteByEmail(email);
    log.debug("Pending registration cleaned up for email: {}", email);

    return createSession(savedUser);
  }

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

  public void initiateForgotPassword(ForgotPasswordRequest input) {
    String email = normalizeEmail(input.email());
    log.info("Password reset requested for email: {}", email);

    // Always return success — never reveal whether email exists
    if (!userRepository.existsByEmail(email)) {
      log.info("Password reset requested for non-existent email (suppressed): {}", email);
      return;
    }

    PasswordResetRequest reset = passwordResetRequestRepository.findByEmail(email)
        .orElse(PasswordResetRequest.builder().email(email).attemptCount(0).build());

    Instant rateLimitWindow = Instant.now().minus(
        appProperties.otp().rateLimitWindowMinutes(), ChronoUnit.MINUTES);
    if (reset.getLastAttemptAt() != null
        && reset.getLastAttemptAt().isAfter(rateLimitWindow)
        && reset.getAttemptCount() >= appProperties.otp().maxAttemptsPerWindow()) {
      log.warn("Password reset rate limited for email: {}. Attempts: {}", email, reset.getAttemptCount());
      // Silently suppress to avoid enumeration via rate-limit errors
      return;
    }

    if (reset.getLastAttemptAt() == null || reset.getLastAttemptAt().isBefore(rateLimitWindow)) {
      reset.setAttemptCount(0);
    }

    String otp = otpService.generateOtp();
    reset.setOtpHash(otpService.hashOtp(otp));
    reset.setAttemptCount(reset.getAttemptCount() + 1);
    reset.setLastAttemptAt(Instant.now());
    reset.setExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));

    passwordResetRequestRepository.save(reset);
    emailService.sendPasswordResetOtp(email, otp);
  }

  public AuthSession resetPassword(ResetPasswordRequest input) {
    String email = normalizeEmail(input.email());
    log.info("Password reset verification requested for email: {}", email);

    PasswordResetRequest reset = passwordResetRequestRepository.findByEmail(email)
        .orElseThrow(() -> new AppException("OTP_EXPIRED", "Reset code has expired. Please request a new one.", HttpStatus.BAD_REQUEST));

    if (!otpService.verifyOtp(input.otp(), reset.getOtpHash())) {
      log.warn("Password reset failed - invalid OTP for email: {}", email);
      throw new AppException("OTP_INVALID", "Invalid reset code", HttpStatus.BAD_REQUEST);
    }

    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new AppException("USER_NOT_FOUND", "Account not found", HttpStatus.NOT_FOUND));

    user.setPasswordHash(passwordEncoder.encode(input.newPassword()));
    userRepository.save(user);

    passwordResetRequestRepository.deleteByEmail(email);
    log.info("Password reset successful for email: {}", email);

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
    String refreshTokenId = new ObjectId().toHexString();
    Instant refreshTokenExpiresAt = Instant.now().plus(jwtService.getRefreshTokenTtl());
    String refreshToken = jwtService.signRefreshToken(user.getId(), refreshTokenId);

    refreshTokenRepository.save(RefreshToken.builder()
        .id(refreshTokenId)
        .userId(user.getId())
        .tokenHash(hashRefreshToken(refreshToken))
        .expiresAt(refreshTokenExpiresAt)
        .build());

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
