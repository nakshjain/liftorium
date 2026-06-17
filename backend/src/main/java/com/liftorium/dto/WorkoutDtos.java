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
      int reps,
      double weight,
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

  public record AddWorkoutSetRequest(
      @NotNull @Min(0) @Max(1000) Integer reps,
      @NotNull @Min(0) @Max(2000) Double weight,
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

  public record SyncWorkoutSetRequest(
      @NotNull @Min(0) @Max(1000) Integer reps,
      @NotNull @Min(0) @Max(2000) Double weight,
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
