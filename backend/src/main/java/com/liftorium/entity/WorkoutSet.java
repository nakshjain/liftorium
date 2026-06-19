package com.liftorium.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * A single logged set within a {@link WorkoutExercise}.
 *
 * <p>Which fields are populated depends on the parent exercise's
 * {@link TrackingType}:
 *
 * <ul>
 *   <li><b>WEIGHT_REPS</b> — reps + weight required</li>
 *   <li><b>REPS_ONLY</b>   — reps required; weight optional</li>
 *   <li><b>DURATION</b>    — durationSeconds required</li>
 *   <li><b>CARDIO</b>      — durationSeconds required; distanceKm / speed / incline optional</li>
 * </ul>
 *
 * <p>All numeric fields use nullable wrapper types so absent values are
 * stored as MongoDB {@code null} rather than 0, making queries and
 * analytics unambiguous.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutSet {

  @Builder.Default
  @Field("_id")
  private String id = new ObjectId().toHexString();

  private int order;

  // ── Strength fields ───────────────────────────────────────────────────────
  /** Number of repetitions. Required for WEIGHT_REPS and REPS_ONLY. */
  private Integer reps;

  /** Load in kilograms. Required for WEIGHT_REPS; optional for REPS_ONLY. */
  private Double weight;

  // ── Duration field ────────────────────────────────────────────────────────
  /** Duration in seconds. Required for DURATION and CARDIO. */
  private Integer durationSeconds;

  // ── Cardio fields ─────────────────────────────────────────────────────────
  /** Distance covered in kilometres. Optional; CARDIO only. */
  private Double distanceKm;

  /** Speed in km/h. Optional; CARDIO only. */
  private Double speed;

  /** Incline percentage. Optional; CARDIO only. */
  private Double incline;

  // ── Audit ─────────────────────────────────────────────────────────────────
  private Instant completedAt;
}
