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
 * An immutable record of a single PR achievement.
 * Never updated after creation — append-only event log.
 *
 * <p>Designed for extensibility: prType and value are generic enough
 * to accommodate future PR variants (e.g. VOLUME) without schema changes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "pr_events")
@CompoundIndexes({
    @CompoundIndex(
        name = "user_achieved_idx",
        def = "{'userId': 1, 'achievedAt': -1}"
    ),
    @CompoundIndex(
        name = "user_exercise_type_idx",
        def = "{'userId': 1, 'exerciseId': 1, 'prType': 1, 'achievedAt': -1}"
    )
})
public class PrEvent {

  @Id
  private String id;

  @Indexed
  private String userId;

  @Indexed
  private String exerciseId;

  /** The type of PR this event represents. */
  private PrType prType;

  /**
   * The achieved value.
   * For WEIGHT: the weight in kg.
   * For REPS: the rep count (weight context stored in exerciseProgress).
   * For ESTIMATED_ONE_REP_MAX: the calculated e1RM value.
   *
   * @deprecated Prefer {@link #newValue}. Kept for backward compatibility.
   */
  private double value;

  /**
   * The previous record value before this PR was set.
   * Null when this is the first PR ever achieved for this type.
   */
  private Double previousValue;

  /**
   * The new record value achieved by this PR event.
   * Mirrors {@link #value} but explicitly named for clarity.
   */
  private Double newValue;

  /** The workout in which this PR was achieved. */
  @Indexed
  private String workoutId;

  /** When the PR was achieved (set completedAt, or workout finishedAt as fallback). */
  @Indexed
  private Instant achievedAt;
}
