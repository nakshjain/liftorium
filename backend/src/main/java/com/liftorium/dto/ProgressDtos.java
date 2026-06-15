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
      String lastImprovedAt
  ) {
  }

  // ── PR timeline ───────────────────────────────────────────────────────

  public record PrEventDto(
      String id,
      String exerciseId,
      String exerciseName,
      PrType prType,
      double value,
      Double previousValue,
      Double newValue,
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
