package com.liftorium.service;

import java.security.SecureRandom;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

  private static final SecureRandom RANDOM = new SecureRandom();

  private final PasswordEncoder passwordEncoder;

  public String generateOtp() {
    int code = RANDOM.nextInt(100_000, 1_000_000);
    log.debug("Generated new OTP code");
    return String.valueOf(code);
  }

  public String hashOtp(String otp) {
    log.debug("Hashing OTP for secure storage");
    return passwordEncoder.encode(otp);
  }

  public boolean verifyOtp(String rawOtp, String hashedOtp) {
    boolean isValid = passwordEncoder.matches(rawOtp, hashedOtp);
    log.debug("OTP verification result: {}", isValid ? "valid" : "invalid");
    return isValid;
  }
}
