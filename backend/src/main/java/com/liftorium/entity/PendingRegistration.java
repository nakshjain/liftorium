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
@Document(collection = "pending_registrations")
public class PendingRegistration {

  @Id
  private String id;

  @Indexed(unique = true)
  private String email;

  private String displayName;

  private String passwordHash;

  private String otpHash;

  private int attemptCount;

  private Instant lastAttemptAt;

  @Indexed(expireAfter = "0s")
  private Instant expiresAt;
}
