package com.gymhelper.dto;

import com.gymhelper.entity.WorkoutSetType;
import com.gymhelper.entity.WorkoutStatus;
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

  public record TempoDto(
      @Min(0) @Max(20) Integer eccentric,
      @Min(0) @Max(20) Integer pauseBottom,
      @Min(0) @Max(20) Integer concentric,
      @Min(0) @Max(20) Integer pauseTop
  ) {
  }

  public record WorkoutSetDto(
      String id,
      int order,
      int reps,
      double weight,
      Integer restTimeSeconds,
      Integer durationSeconds,
      Double rpe,
      boolean isWarmup,
      WorkoutSetType setType,
      TempoDto tempo,
      String notes,
      String completedAt
  ) {
  }

  public record WorkoutExerciseDto(
      String id,
      String exerciseId,
      int order,
      String supersetGroupId,
      String notes,
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
      @NotBlank String exerciseId,
      @Size(min = 1, max = 80) String supersetGroupId,
      @Size(min = 1, max = 2000) String notes
  ) {
  }

  public record AddWorkoutSetRequest(
      @NotNull @Min(0) @Max(1000) Integer reps,
      @NotNull @Min(0) @Max(2000) Double weight,
      @Min(0) @Max(7200) Integer restTimeSeconds,
      @Min(0) @Max(7200) Integer durationSeconds,
      @Min(1) @Max(10) Double rpe,
      Boolean isWarmup,
      WorkoutSetType setType,
      @Valid TempoDto tempo,
      @Size(min = 1, max = 2000) String notes,
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
      @Min(1) @Max(100) int limit
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
}
