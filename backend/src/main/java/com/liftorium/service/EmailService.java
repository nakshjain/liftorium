package com.liftorium.service;

import com.liftorium.config.AppProperties;
import com.liftorium.exception.AppException;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Slf4j
@Service
public class EmailService {

  private static final String RESEND_BASE_URL = "https://api.resend.com";

  private final AppProperties appProperties;
  private final RestClient resendClient;

  public EmailService(AppProperties appProperties, RestClient.Builder restClientBuilder) {
    this.appProperties = appProperties;
    this.resendClient = restClientBuilder
        .baseUrl(RESEND_BASE_URL)
        .defaultHeader("Authorization", "Bearer " + appProperties.email().resendApiKey())
        .build();
  }

  public void sendOtp(String toEmail, String otp) {
    String expiryText = appProperties.otp().expiryMinutes() + " minutes";
    sendEmail(
        toEmail,
        "Liftorium - Verify your email",
        "Your verification code is: " + otp + "\n\nThis code expires in " + expiryText + ".",
        "<p>Your verification code is:</p><p><strong>" + otp + "</strong></p>"
            + "<p>This code expires in " + expiryText + ".</p>",
        "verification",
        "Failed to send verification email"
    );
  }

  public void sendPasswordResetOtp(String toEmail, String otp) {
    String expiryText = appProperties.otp().expiryMinutes() + " minutes";
    sendEmail(
        toEmail,
        "Liftorium - Reset your password",
        "Your password reset code is: " + otp + "\n\nThis code expires in " + expiryText
            + ".\n\nIf you didn't request this, you can safely ignore this email.",
        "<p>Your password reset code is:</p><p><strong>" + otp + "</strong></p>"
            + "<p>This code expires in " + expiryText + ".</p>"
            + "<p>If you didn't request this, you can safely ignore this email.</p>",
        "password reset",
        "Failed to send password reset email"
    );
  }

  private void sendEmail(
      String toEmail,
      String subject,
      String text,
      String html,
      String emailType,
      String failureMessage
  ) {
    log.info("Attempting to send {} OTP email to: {}", emailType, toEmail);
    try {
      ResendEmailResponse response = resendClient.post()
          .uri("/emails")
          .body(new ResendEmailRequest(
              appProperties.email().from(),
              List.of(toEmail),
              subject,
              html,
              text
          ))
          .retrieve()
          .body(ResendEmailResponse.class);

      log.info("{} OTP email sent successfully to: {}. Resend message id: {}", emailType, toEmail,
          response == null ? "unknown" : response.id());
    } catch (RestClientResponseException e) {
      log.error("Resend failed to send {} OTP email to: {}. Status: {}, Body: {}", emailType, toEmail,
          e.getStatusCode(), e.getResponseBodyAsString(), e);
      throw new AppException("EMAIL_SEND_FAILED", failureMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (Exception e) {
      log.error("Failed to send {} OTP email to: {}. Error: {}", emailType, toEmail, e.getMessage(), e);
      throw new AppException("EMAIL_SEND_FAILED", failureMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private record ResendEmailRequest(
      String from,
      List<String> to,
      String subject,
      String html,
      String text
  ) {
  }

  private record ResendEmailResponse(String id) {
  }
}
