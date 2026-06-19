package com.liftorium.entity;

/**
 * Defines how a set is tracked for a given exercise.
 *
 * <p>This enum drives validation, UI rendering, and PR analytics. Every
 * exercise has exactly one tracking type, which determines which fields
 * are required and which are optional on {@link WorkoutSet}.
 *
 * <ul>
 *   <li>{@link #WEIGHT_REPS} — Classic barbell / dumbbell lifts (Bench Press, Squat, Deadlift)</li>
 *   <li>{@link #REPS_ONLY} — Bodyweight exercises where load isn't tracked (Pull-Up, Dip, Push-Up)</li>
 *   <li>{@link #DURATION} — Isometric holds (Plank, Wall Sit, L-Sit, Dead Hang)</li>
 *   <li>{@link #CARDIO} — Cardio machines and distance-based activities (Treadmill, Cycling, Rowing)</li>
 * </ul>
 */
public enum TrackingType {

  /** Requires reps + weight. Weight PR, rep PR, and estimated 1RM analytics apply. */
  WEIGHT_REPS,

  /** Requires reps only; weight is optional. Max-rep PR analytics apply. */
  REPS_ONLY,

  /** Requires durationSeconds. Longest-duration PR analytics apply. */
  DURATION,

  /**
   * Requires durationSeconds. distanceKm, speed, and incline are optional.
   * Longest-duration, longest-distance, and fastest-pace PR analytics apply.
   */
  CARDIO
}
