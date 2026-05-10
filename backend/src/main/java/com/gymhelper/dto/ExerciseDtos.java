package com.gymhelper.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.hibernate.validator.constraints.URL;

public final class ExerciseDtos {

  private ExerciseDtos() {
  }

  public record ExerciseDto(
      String id,
      String name,
      String description,
      String category,
      String equipment,
      List<String> targetMuscles,
      List<String> secondaryMuscles,
      List<String> instructions,
      List<String> tips,
      String mediaUrl,
      String createdAt,
      String updatedAt
  ) {
  }

  public record CreateExerciseRequest(
      @NotBlank @Size(max = 160) String name,
      @NotBlank @Size(max = 2000) String description,
      @NotBlank @Size(max = 160) String category,
      @NotBlank @Size(max = 160) String equipment,
      @NotEmpty @Size(max = 20) List<@NotBlank @Size(max = 160) String> targetMuscles,
      @Size(max = 20) List<@NotBlank @Size(max = 160) String> secondaryMuscles,
      @NotEmpty @Size(max = 20) List<@NotBlank @Size(max = 160) String> instructions,
      @Size(max = 20) List<@NotBlank @Size(max = 160) String> tips,
      @URL @Size(max = 2048) String mediaUrl
  ) {
  }

  public record UpdateExerciseRequest(
      @Size(max = 160) String name,
      @Size(max = 2000) String description,
      @Size(max = 160) String category,
      @Size(max = 160) String equipment,
      @Size(max = 20) List<@NotBlank @Size(max = 160) String> targetMuscles,
      @Size(max = 20) List<@NotBlank @Size(max = 160) String> secondaryMuscles,
      @Size(max = 20) List<@NotBlank @Size(max = 160) String> instructions,
      @Size(max = 20) List<@NotBlank @Size(max = 160) String> tips,
      @URL @Size(max = 2048) String mediaUrl
  ) {
  }

  public record ListExercisesQuery(
      @Min(1) int page,
      @Min(1) @Max(100) int limit,
      String search,
      String muscleGroup,
      String equipment,
      String category
  ) {
  }

  public record PaginatedExercisesDto(
      List<ExerciseDto> items,
      int page,
      int limit,
      long total,
      int totalPages
  ) {
  }
}
