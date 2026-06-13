package com.liftorium.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class PlanDtos {

  private PlanDtos() {}

  public record PlanSetRequest(
      @Min(1) @Max(100) int reps
  ) {}

  public record PlanExerciseRequest(
      @NotNull @Size(max = 50) String exerciseId,
      @NotNull @Size(max = 120) String exerciseName,
      @NotNull @Size(min = 1, max = 20) @Valid List<PlanSetRequest> sets,
      @Min(0) @Max(50) int order
  ) {}

  public record PlanDayRequest(
      @Min(0) @Max(6) int dayOfWeek,
      @Size(max = 60) String label,
      @NotNull @Size(max = 10) List<@Size(max = 30) String> muscleGroups,
      @NotNull @Size(max = 20) @Valid List<PlanExerciseRequest> exercises,
      boolean rest
  ) {}

  public record UpsertPlanRequest(
      @NotNull @Size(min = 7, max = 7) @Valid List<PlanDayRequest> days
  ) {}

  public record PlanSetDto(
      int reps
  ) {}

  public record PlanExerciseDto(
      String exerciseId,
      String exerciseName,
      List<PlanSetDto> sets,
      int order
  ) {}

  public record PlanDayDto(
      int dayOfWeek,
      String label,
      List<String> muscleGroups,
      List<PlanExerciseDto> exercises,
      boolean rest
  ) {}

  public record WorkoutPlanDto(
      String id,
      List<PlanDayDto> days,
      String updatedAt
  ) {}
}
