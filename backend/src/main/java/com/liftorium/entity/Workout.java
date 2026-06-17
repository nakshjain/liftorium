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
@Document(collection = "workouts")
@CompoundIndexes({
    @CompoundIndex(name = "user_status_started_idx", def = "{'userId': 1, 'status': 1, 'startedAt': -1}"),
    @CompoundIndex(name = "user_finished_idx", def = "{'userId': 1, 'finishedAt': -1}"),
    @CompoundIndex(name = "user_exercise_started_idx", def = "{'userId': 1, 'exercises.exerciseId': 1, 'startedAt': -1}"),
    @CompoundIndex(name = "user_clientid_idx", def = "{'userId': 1, 'clientId': 1}")
})
public class Workout {

  @Id
  private String id;

  @Indexed
  private String userId;

  private String name;

  @Indexed
  private WorkoutStatus status;

  @Indexed
  private Instant startedAt;

  private Instant finishedAt;

  private Integer durationSeconds;

  private String notes;

  @Builder.Default
  private List<WorkoutExercise> exercises = new ArrayList<>();

  @CreatedDate
  private Instant createdAt;

  @LastModifiedDate
  private Instant updatedAt;

  @Indexed
  private String clientId;  // nullable; set only for guest-synced workouts
}
