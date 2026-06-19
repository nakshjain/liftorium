package com.liftorium.entity.progress;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * One progression data point per exercise per completed workout.
 *
 * <p>Created unconditionally for every exercise in a completed workout —
 * regardless of whether a PR was achieved. This gives a true picture of the
 * athlete's progression over time (e.g. 35 → 45 → 47.5), rather than a
 * noisy stream of every intermediate weight touched within a session.
 *
 * <p>For each exercise, stores:
 * <ul>
 *   <li>{@link #bestWeight} — highest weight lifted across all sets this session</li>
 *   <li>{@link #bestSetWeight} / {@link #bestSetReps} — the set that yielded the
 *       highest estimated 1RM</li>
 *   <li>{@link #estimatedOneRepMax} — Epley e1RM derived from the best set</li>
 * </ul>
 *
 * <p>Append-only — never mutated after creation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "exercise_progress_history")
@CompoundIndexes({
    @CompoundIndex(
        name = "user_exercise_performed_idx",
        def = "{'userId': 1, 'exerciseId': 1, 'performedAt': 1}"
    ),
    @CompoundIndex(
        name = "user_exercise_workout_uq",
        def = "{'userId': 1, 'exerciseId': 1, 'workoutId': 1}",
        unique = true
    )
})
public class ExerciseProgressHistory {

  @Id
  private String id;

  @Indexed
  private String userId;

  @Indexed
  private String exerciseId;

  /** The workout this snapshot belongs to. */
  @Indexed
  private String workoutId;

  /**
   * Highest weight lifted for this exercise across all sets in the workout.
   * Null for DURATION / CARDIO exercises.
   */
  private Double bestWeight;

  /**
   * Weight of the set that produced the highest estimated 1RM this session.
   * Null for DURATION / CARDIO exercises.
   */
  private Double bestSetWeight;

  /**
   * Reps of the set that produced the highest estimated 1RM this session.
   * Zero for DURATION / CARDIO exercises.
   */
  private int bestSetReps;

  /**
   * Estimated 1RM calculated from bestSetWeight/bestSetReps via Epley formula.
   * Zero for DURATION / CARDIO exercises.
   */
  private double estimatedOneRepMax;

  /**
   * Longest duration (seconds) achieved across all sets in this workout session.
   * Null for WEIGHT_REPS / REPS_ONLY exercises.
   */
  private Integer bestDurationSeconds;

  /**
   * Longest distance (km) covered in any single set this session.
   * Null for non-CARDIO exercises.
   */
  private Double bestDistanceKm;

  /** When the workout was performed (workout finishedAt). */
  @Indexed
  private Instant performedAt;
}
