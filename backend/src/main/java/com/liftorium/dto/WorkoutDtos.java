package com.liftorium.dto;

import com.liftorium.entity.WorkoutStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class WorkoutDtos {

  private WorkoutDtos() {
  }

  public record WorkoutSetDto(
      String id,
      int order,
      // ── Strength ────────────────────────────────────────────────────────
      Integer reps,
      Double weight,
      // ── Duration / Cardio ────────────────────────────────────────────────
      Integer durationSeconds,
      // ── Cardio optional ─────────────────────────────────────────────────
      Double distanceKm,
      Double speed,
      Double incline,
      // ── Audit ────────────────────────────────────────────────────────────
      String completedAt
  ) {
  }

  public record WorkoutExerciseDto(
      String id,
      String exerciseId,
      String exerciseName,
      int order,
      List<WorkoutSetDto> sets
  ) {
  }

  public record WorkoutDto(
      String id,
      String userId,
      String name,
      WorkoutStatus status,
      String startedAt,
      String finishedAt,
      Integer durationSeconds,
      String notes,
      List<WorkoutExerciseDto> exercises,
      String createdAt,
      String updatedAt
  ) {
  }

  public record StartWorkoutRequest(
      @NotBlank @Size(max = 120) String name,
      String startedAt,
      @Size(min = 1, max = 2000) String notes
  ) {
  }

  public record AddWorkoutExerciseRequest(
      @NotBlank String exerciseId
  ) {
  }

  /**
   * Request body for POST /workouts/{id}/exercises/{exId}/sets.
   *
   * <p>Which fields are required depends on the exercise's TrackingType and is
   * enforced by {@link com.liftorium.validation.WorkoutSetValidator} in the
   * service layer — not by Jakarta annotations here — because the constraint
   * depends on a separate entity (the Exercise) that isn't available at the
   * bean-validation layer.
   */
  public record AddWorkoutSetRequest(
      // ── Strength ──────────────────────────────────────────────────────────
      @Min(0) @Max(1000) Integer reps,
      @Min(0) @Max(2000) Double weight,
      // ── Duration / Cardio ─────────────────────────────────────────────────
      @Min(1) @Max(86400) Integer durationSeconds,
      // ── Cardio optional ───────────────────────────────────────────────────
      @Min(0) @Max(1000) Double distanceKm,
      @Min(0) @Max(100)  Double speed,
      @Min(0) @Max(100)  Double incline,
      // ── Audit ─────────────────────────────────────────────────────────────
      String completedAt
  ) {
  }

  public record FinishWorkoutRequest(
      String finishedAt,
      @Min(0) @Max(86400) Integer durationSeconds,
      @Size(min = 1, max = 2000) String notes
  ) {
  }

  public record ListWorkoutHistoryQuery(
      @Min(1) int page,
      @Min(1) @Max(100) int limit,
      String month
  ) {
  }

  public record PaginatedWorkoutsDto(
      List<WorkoutDto> items,
      int page,
      int limit,
      long total,
      int totalPages
  ) {
  }

  public record WorkoutStatsDto(
      int sessions,
      double totalVolume,
      int totalSets,
      int streak,
      double previousMonthVolume
  ) {
  }

  /**
   * Per-set entry within a sync request.
   * Same nullable semantics as {@link AddWorkoutSetRequest}.
   */
  public record SyncWorkoutSetRequest(
      @Min(0) @Max(1000) Integer reps,
      @Min(0) @Max(2000) Double weight,
      @Min(1) @Max(86400) Integer durationSeconds,
      @Min(0) @Max(1000) Double distanceKm,
      @Min(0) @Max(100)  Double speed,
      @Min(0) @Max(100)  Double incline,
      String completedAt
  ) {
  }

  public record SyncWorkoutExerciseRequest(
      @NotBlank String exerciseId,
      @NotNull @Valid List<SyncWorkoutSetRequest> sets
  ) {
  }

  public record SyncWorkoutRequest(
      @NotBlank String clientId,
      @NotBlank @Size(max = 120) String name,
      @NotNull String startedAt,
      @NotNull String finishedAt,
      @Min(0) Integer durationSeconds,
      @NotNull @Valid List<SyncWorkoutExerciseRequest> exercises
  ) {
  }

  public record SyncBulkRequest(
      @NotNull @Size(min = 1, max = 50) @Valid List<SyncWorkoutRequest> workouts
  ) {
  }

  public record SyncBulkResponse(
      int synced,
      int skipped
  ) {
  }
}
