package com.liftorium.entity.progress;

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

/**
 * Represents a user's all-time progression state for a single exercise.
 * One document per (userId, exerciseId) pair — enforced by unique index.
 *
 * <p>Designed for extensibility: adding volume PRs, muscle analytics, or
 * plateau detection in future versions requires adding fields here
 * without a schema redesign.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "exercise_progress")
@CompoundIndexes({
    @CompoundIndex(
        name = "user_exercise_uq",
        def = "{'userId': 1, 'exerciseId': 1}",
        unique = true
    ),
    @CompoundIndex(
        name = "user_last_improved_idx",
        def = "{'userId': 1, 'lastImprovedAt': -1}"
    )
})
public class ExerciseProgress {

  @Id
  private String id;

  @Indexed
  private String userId;

  @Indexed
  private String exerciseId;

  // ── Weight PR ─────────────────────────────────────────────────────────
  /** Highest weight ever lifted for this exercise (any rep count). */
  @Builder.Default
  private double weightPr = 0.0;

  /**
   * The very first weight PR ever achieved for this exercise.
   * Set once when weightPr first exceeds 0 — never overwritten.
   * Enables "Started: 20kg → Now: 47.5kg" summaries without history aggregation.
   */
  private Double firstWeightPr;

  // ── Rep PR ────────────────────────────────────────────────────────────
  /** The weight at which the rep PR was achieved. */
  @Builder.Default
  private double repPrWeight = 0.0;

  /** Highest reps achieved at repPrWeight. */
  @Builder.Default
  private int repPrReps = 0;

  // ── Estimated 1RM PR ──────────────────────────────────────────────────
  /** Highest estimated 1RM ever calculated for this exercise (Epley formula). */
  @Builder.Default
  private double estimatedOneRepMaxPr = 0.0;

  /**
   * The very first estimated 1RM PR ever achieved for this exercise.
   * Set once when estimatedOneRepMaxPr first exceeds 0 — never overwritten.
   * Enables "Started: 38 → Now: 60.2" summaries without history aggregation.
   */
  private Double firstEstimatedOneRepMax;

  // ── Counters ──────────────────────────────────────────────────────────
  /** Total number of PR events recorded for this exercise. */
  @Builder.Default
  private int totalPrs = 0;

  // ── Timestamps ────────────────────────────────────────────────────────
  /** When the most recent PR was achieved. Null until the first PR. */
  private Instant lastImprovedAt;

  @CreatedDate
  private Instant createdAt;

  @LastModifiedDate
  private Instant updatedAt;
}
