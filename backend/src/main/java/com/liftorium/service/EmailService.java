package com.liftorium.service;

import com.liftorium.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

  private final JavaMailSender mailSender;

  @Value("${spring.mail.username}")
  private String fromEmail;

  public void sendOtp(String toEmail, String otp) {
    log.info("Attempting to send OTP email to: {}", toEmail);
    try {
      SimpleMailMessage message = new SimpleMailMessage();
      message.setFrom(fromEmail);
      message.setTo(toEmail);
      message.setSubject("Liftorium — Verify your email");
      message.setText("Your verification code is: " + otp + "\n\nThis code expires in 5 minutes.");
      mailSender.send(message);
      log.info("OTP email sent successfully to: {}", toEmail);
    } catch (Exception e) {
      log.error("Failed to send OTP email to: {}. Error: {}", toEmail, e.getMessage(), e);
      throw new AppException("EMAIL_SEND_FAILED", "Failed to send verification email", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
