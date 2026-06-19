package com.liftorium.entity.progress;

/**
 * The supported personal record types.
 *
 * <p>Which types are evaluated depends on the exercise's {@link com.liftorium.entity.TrackingType}:
 * <ul>
 *   <li>WEIGHT_REPS  → WEIGHT, REPS, ESTIMATED_ONE_REP_MAX</li>
 *   <li>REPS_ONLY    → REPS</li>
 *   <li>DURATION     → DURATION</li>
 *   <li>CARDIO       → DURATION, DISTANCE</li>
 * </ul>
 */
public enum PrType {
  /** Highest weight lifted in a single set. Applies to WEIGHT_REPS. */
  WEIGHT,

  /** Highest rep count in a single set. Applies to WEIGHT_REPS and REPS_ONLY. */
  REPS,

  /** Highest estimated one-rep max (Epley). Applies to WEIGHT_REPS. */
  ESTIMATED_ONE_REP_MAX,

  /** Longest duration (seconds) in a single set. Applies to DURATION and CARDIO. */
  DURATION,

  /** Longest distance (km) in a single set. Applies to CARDIO. */
  DISTANCE
}
