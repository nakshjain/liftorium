package com.gymhelper.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "exercise_provider_mappings")
@CompoundIndexes({
    @CompoundIndex(
        name = "provider_external_id_uq",
        def = "{'provider': 1, 'providerExerciseId': 1}",
        unique = true
    ),
    @CompoundIndex(
        name = "exercise_provider_uq",
        def = "{'exerciseId': 1, 'provider': 1}",
        unique = true
    ),
    @CompoundIndex(name = "provider_active_last_seen_idx", def = "{'provider': 1, 'active': 1, 'lastSeenAt': 1}")
})
public class ExerciseProviderMapping {

  @Id
  private String id;

  private ExerciseProviderType provider;
  private String providerExerciseId;

  @Indexed
  private String exerciseId;

  private String providerDatasetVersion;
  private String providerName;
  private String contentFingerprint;

  @Builder.Default
  private boolean active = true;

  @Builder.Default
  private boolean preferredForContent = true;

  private Instant firstSeenAt;
  private Instant lastSeenAt;
  private Instant lastSyncedAt;
  private Instant missingSince;

  @CreatedDate
  private Instant createdAt;

  @LastModifiedDate
  private Instant updatedAt;
}
