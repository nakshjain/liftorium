package com.gymhelper.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class PlanDtos {

  private PlanDtos() {}

  public record PlanDayRequest(
      @Min(0) @Max(6) int dayOfWeek,
      @Size(max = 60) String label,
      @NotNull @Size(max = 10) List<@Size(max = 30) String> muscleGroups,
      boolean rest
  ) {}

  public record UpsertPlanRequest(
      @NotNull @Size(min = 7, max = 7) @Valid List<PlanDayRequest> days
  ) {}

  public record PlanDayDto(
      int dayOfWeek,
      String label,
      List<String> muscleGroups,
      boolean rest
  ) {}

  public record WorkoutPlanDto(
      String id,
      List<PlanDayDto> days,
      String updatedAt
  ) {}
}
