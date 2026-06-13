package com.liftorium.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "password_reset_requests")
public class PasswordResetRequest {

  @Id
  private String id;

  @Indexed(unique = true)
  private String email;

  private String otpHash;

  private int attemptCount;

  private Instant lastAttemptAt;

  @Indexed(expireAfter = "0s")
  private Instant expiresAt;
}
