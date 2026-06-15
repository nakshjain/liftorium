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
 * A progression snapshot taken whenever any PR is achieved for an exercise.
 * One document per (userId, exerciseId, workoutId) — one snapshot per session
 * that produced at least one PR.
 *
 * <p>Captures the best values across ALL sets in the workout for this exercise,
 * not just the specific set that triggered the PR. This gives a complete picture
 * of the athlete's state at that point in time and is the source of truth for
 * progression charts and trend analytics.
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
        name = "user_exercise_achieved_idx",
        def = "{'userId': 1, 'exerciseId': 1, 'achievedAt': 1}"
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

  /** The workout in which these PRs were achieved. */
  @Indexed
  private String workoutId;

  /**
   * Highest weight lifted for this exercise across all sets in the workout.
   * Matches the WEIGHT PR value if a weight PR was set this session.
   */
  private double maxWeight;

  /**
   * Weight of the set that produced the best estimated 1RM this session.
   * This is the "best set" in terms of overall performance (not just raw weight).
   */
  private double bestSetWeight;

  /**
   * Reps of the set that produced the best estimated 1RM this session.
   */
  private int bestSetReps;

  /**
   * Estimated 1RM calculated from bestSetWeight/bestSetReps using Epley formula.
   * Rounded to 2 decimal places.
   */
  private double estimatedOneRepMax;

  /** When the PR was achieved — set completedAt if available, else workout finishedAt. */
  @Indexed
  private Instant achievedAt;
}
