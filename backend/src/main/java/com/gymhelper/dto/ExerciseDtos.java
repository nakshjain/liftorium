package com.gymhelper.dto;

import com.gymhelper.entity.ExerciseProviderType;
import com.gymhelper.entity.ExerciseType;
import com.gymhelper.entity.MovementPattern;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public final class ExerciseDtos {

  private ExerciseDtos() {
  }

  public record ExerciseDto(
      String id,
      String name,
      String slug,
      List<String> aliases,
      List<String> primaryMuscles,
      List<String> secondaryMuscles,
      List<String> bodyParts,
      List<String> equipment,
      MovementPattern movementPattern,
      ExerciseType exerciseType,
      boolean active,
      ExerciseContentDto content,
      String createdAt,
      String updatedAt
  ) {
  }

  public record ExerciseContentDto(
      ExerciseProviderType provider,
      String overview,
      List<String> instructions,
      List<String> tips,
      Map<String, String> imageUrls,
      String videoUrl
  ) {
  }

  public record ListExercisesQuery(
      @Min(1) @Max(100) int limit,
      @Size(max = 500) String cursor,
      @Size(max = 80) String muscle,
      @Size(max = 80) String equipment,
      ExerciseType exerciseType,
      MovementPattern movementPattern
  ) {
  }

  public record SearchExercisesQuery(
      @NotBlank @Size(min = 2, max = 120) String query,
      @Min(1) @Max(25) int limit,
      @Size(max = 80) String muscle,
      @Size(max = 80) String equipment
  ) {
  }

  public record CursorPageDto(
      List<ExerciseDto> items,
      String nextCursor,
      boolean hasNext
  ) {
  }
}
