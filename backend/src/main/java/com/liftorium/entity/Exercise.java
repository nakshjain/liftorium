package com.liftorium.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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
@Document(collection = "exercises")
@CompoundIndexes({
    @CompoundIndex(name = "active_name_cursor_idx", def = "{'active': 1, 'normalizedName': 1, '_id': 1}"),
    @CompoundIndex(name = "active_search_prefix_name_idx", def = "{'active': 1, 'searchPrefixes': 1, 'normalizedName': 1}"),
    @CompoundIndex(name = "active_primary_muscle_name_idx", def = "{'active': 1, 'primaryMuscles': 1, 'normalizedName': 1}"),
    @CompoundIndex(name = "active_secondary_muscle_name_idx", def = "{'active': 1, 'secondaryMuscles': 1, 'normalizedName': 1}"),
    @CompoundIndex(name = "active_equipment_name_idx", def = "{'active': 1, 'equipment': 1, 'normalizedName': 1}"),
    @CompoundIndex(name = "active_type_name_idx", def = "{'active': 1, 'exerciseType': 1, 'normalizedName': 1}"),
    @CompoundIndex(name = "active_level_name_idx", def = "{'active': 1, 'level': 1, 'normalizedName': 1}"),
    @CompoundIndex(name = "source_provider_exercise_id_uq", def = "{'source.provider': 1, 'source.providerExerciseId': 1}", unique = true)
})
public class Exercise {

  @Id
  private String id;

  private String name;

  private String normalizedName;

  @Indexed(unique = true, sparse = true)
  private String slug;

  @Builder.Default
  private List<String> searchPrefixes = new ArrayList<>();

  @Builder.Default
  private List<String> primaryMuscles = new ArrayList<>();

  @Builder.Default
  private List<String> secondaryMuscles = new ArrayList<>();

  @Builder.Default
  private List<String> equipment = new ArrayList<>();

  @Builder.Default
  private ExerciseType exerciseType = ExerciseType.OTHER;

  @Builder.Default
  private boolean active = true;

  private ExerciseSourceInfo source;

  private String level;

  private String mechanic;

  private String overview;

  @Builder.Default
  private List<String> instructions = new ArrayList<>();

  private String contentFingerprint;

  private Instant lastSeenAt;

  @CreatedDate
  private Instant createdAt;

  @LastModifiedDate
  private Instant updatedAt;
}
