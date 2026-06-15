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
   * The previous record value before this PR was set.
   * <ul>
   *   <li>WEIGHT: previous weight in kg, or null if first ever</li>
   *   <li>REPS: previous rep count, or null if first ever</li>
   *   <li>ESTIMATED_ONE_REP_MAX: previous e1RM, or null if first ever</li>
   * </ul>
   */
  private Double previousValue;

  /**
   * The new record value set by this PR event.
   * <ul>
   *   <li>WEIGHT: new weight in kg</li>
   *   <li>REPS: new rep count</li>
   *   <li>ESTIMATED_ONE_REP_MAX: new e1RM value</li>
   * </ul>
   */
  private Double newValue;

  /**
   * For REPS PR events: the weight at which the previous rep PR was achieved.
   * Null for non-REPS events and when there was no prior rep PR.
   * Enables rendering "20kg × 10 → 25kg × 12" transitions.
   */
  private Double prevRepWeight;

  /**
   * For REPS PR events: the weight at which the new rep PR was achieved.
   * Null for non-REPS events.
   */
  private Double newRepWeight;

  /** The workout in which this PR was achieved. */
  @Indexed
  private String workoutId;

  /** When the PR was achieved (set completedAt, or workout finishedAt as fallback). */
  @Indexed
  private Instant achievedAt;
}
