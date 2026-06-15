package com.liftorium.dto;

import com.liftorium.entity.progress.PrType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;

public final class ProgressDtos {

  private ProgressDtos() {
  }

  // ── Overview ──────────────────────────────────────────────────────────

  public record ProgressOverviewDto(
      long totalPrs,
      long exercisesImproved,
      String latestPrDate,
      StrongestExerciseDto strongestExercise
  ) {
  }

  public record StrongestExerciseDto(
      String exerciseId,
      String exerciseName,
      double weightPr
  ) {
  }

  // ── Exercise progress list ─────────────────────────────────────────────

  public record ExerciseProgressSummaryDto(
      String exerciseId,
      String exerciseName,
      double weightPr,
      RepPrDto repPr,
      double estimatedOneRepMaxPr,
      int totalPrs,
      long totalSessions,
      String lastImprovedAt
  ) {
  }

  public record RepPrDto(
      double weight,
      int reps
  ) {
  }

  public record PaginatedExerciseProgressDto(
      List<ExerciseProgressSummaryDto> items,
      int page,
      int limit,
      long total,
      int totalPages
  ) {
  }

  // ── Exercise progress detail ───────────────────────────────────────────

  public record ExerciseProgressDetailDto(
      String exerciseId,
      String exerciseName,
      Double firstWeightPr,
      double weightPr,
      RepPrDto repPr,
      Double firstEstimatedOneRepMax,
      double estimatedOneRepMaxPr,
      int totalPrs,
      long totalSessions,
      String lastImprovedAt
  ) {
  }

  // ── PR timeline ───────────────────────────────────────────────────────

  /**
   * A single PR event in the timeline.
   *
   * <p>For all PR types:
   * <ul>
   *   <li>{@code previousValue} — the record before this event (null = first ever PR)</li>
   *   <li>{@code newValue} — the new record set by this event</li>
   * </ul>
   *
   * <p>For REPS PRs only, weight context is also available:
   * <ul>
   *   <li>{@code prevRepWeight} — weight at which the previous rep PR was achieved</li>
   *   <li>{@code newRepWeight} — weight at which the new rep PR was achieved</li>
   * </ul>
   * These two fields allow the frontend to render "20kg × 10 → 25kg × 12".
   */
  public record PrEventDto(
      String id,
      String exerciseId,
      String exerciseName,
      PrType prType,
      Double previousValue,
      Double newValue,
      Double prevRepWeight,
      Double newRepWeight,
      String workoutId,
      String achievedAt
  ) {
  }

  public record PaginatedPrEventsDto(
      List<PrEventDto> items,
      int page,
      int limit,
      long total,
      int totalPages
  ) {
  }

  // ── Exercise progress history ─────────────────────────────────────────

  /**
   * One data point in a progression chart — represents the best performance
   * achieved in a single workout session. Created for every completed workout
   * that included this exercise, regardless of whether a PR was set.
   */
  public record ExerciseProgressHistoryEntryDto(
      String id,
      String workoutId,
      double bestWeight,
      double bestSetWeight,
      int bestSetReps,
      double estimatedOneRepMax,
      String performedAt
  ) {
  }

  public record ExerciseProgressHistoryDto(
      String exerciseId,
      String exerciseName,
      List<ExerciseProgressHistoryEntryDto> entries
  ) {
  }

  // ── Query params ──────────────────────────────────────────────────────

  public record ListExerciseProgressQuery(
      @Min(1) int page,
      @Min(1) @Max(100) int limit,
      String search
  ) {
  }

  public record ListPrEventsQuery(
      @Min(1) int page,
      @Min(1) @Max(100) int limit,
      String prType,
      String exerciseId
  ) {
  }
}
