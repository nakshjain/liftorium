package com.liftorium.validation;

import com.liftorium.entity.TrackingType;
import com.liftorium.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Validates the fields of a workout-set request against the exercise's
 * {@link TrackingType}.
 *
 * <p>Rules:
 * <ul>
 *   <li><b>WEIGHT_REPS</b> — reps and weight are both required and must be ≥ 0.</li>
 *   <li><b>REPS_ONLY</b>   — reps is required and must be ≥ 0; weight is ignored.</li>
 *   <li><b>DURATION</b>    — durationSeconds is required and must be &gt; 0.</li>
 *   <li><b>CARDIO</b>      — durationSeconds is required and must be &gt; 0;
 *                            distanceKm / speed / incline are optional but if
 *                            present must be ≥ 0.</li>
 * </ul>
 *
 * <p>Throws {@link AppException} with {@code VALIDATION_ERROR} on any violation
 * so the global exception handler produces a consistent 422 response.
 */
@Component
public class WorkoutSetValidator {

  /**
   * Validates the incoming set fields.
   *
   * @param trackingType the tracking type of the exercise being logged
   * @param reps         reps field from the request (nullable)
   * @param weight       weight field from the request (nullable)
   * @param durationSeconds duration field from the request (nullable)
   * @param distanceKm   optional distance (nullable)
   * @param speed        optional speed (nullable)
   * @param incline      optional incline (nullable)
   */
  public void validate(
      TrackingType trackingType,
      Integer reps,
      Double weight,
      Integer durationSeconds,
      Double distanceKm,
      Double speed,
      Double incline
  ) {
    switch (trackingType) {
      case WEIGHT_REPS -> {
        requireNonNull(reps, "reps is required for WEIGHT_REPS exercises");
        requireNonNull(weight, "weight is required for WEIGHT_REPS exercises");
        requireMinInt(reps, 0, "reps must be >= 0");
        requireMinDouble(weight, 0.0, "weight must be >= 0");
      }
      case REPS_ONLY -> {
        requireNonNull(reps, "reps is required for REPS_ONLY exercises");
        requireMinInt(reps, 0, "reps must be >= 0");
        if (weight != null) {
          requireMinDouble(weight, 0.0, "weight must be >= 0");
        }
      }
      case DURATION -> {
        requireNonNull(durationSeconds, "durationSeconds is required for DURATION exercises");
        requireMinInt(durationSeconds, 1, "durationSeconds must be > 0");
      }
      case CARDIO -> {
        requireNonNull(durationSeconds, "durationSeconds is required for CARDIO exercises");
        requireMinInt(durationSeconds, 1, "durationSeconds must be > 0");
        if (distanceKm != null) requireMinDouble(distanceKm, 0.0, "distanceKm must be >= 0");
        if (speed != null)      requireMinDouble(speed, 0.0, "speed must be >= 0");
        if (incline != null)    requireMinDouble(incline, 0.0, "incline must be >= 0");
      }
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private void requireNonNull(Object value, String message) {
    if (value == null) {
      throw new AppException("VALIDATION_ERROR", message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  private void requireMinInt(int value, int min, String message) {
    if (value < min) {
      throw new AppException("VALIDATION_ERROR", message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  private void requireMinDouble(double value, double min, String message) {
    if (value < min) {
      throw new AppException("VALIDATION_ERROR", message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
