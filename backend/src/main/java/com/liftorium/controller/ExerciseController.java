package com.liftorium.controller;

import com.liftorium.dto.ApiResponse;
import com.liftorium.dto.CatalogVersionResponse;
import com.liftorium.dto.ExerciseDtos.CursorPageDto;
import com.liftorium.dto.ExerciseDtos.ExerciseDto;
import com.liftorium.dto.ExerciseDtos.ListExercisesQuery;
import com.liftorium.dto.ExerciseDtos.SearchExercisesQuery;
import com.liftorium.entity.ExerciseType;
import com.liftorium.service.CatalogVersionService;
import com.liftorium.service.ExerciseService;
import com.liftorium.util.ObjectIdValidator;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/exercises")
@RequiredArgsConstructor
public class ExerciseController {

  private final ExerciseService exerciseService;
  private final CatalogVersionService catalogVersionService;

  @GetMapping("/catalog-version")
  public ApiResponse<CatalogVersionResponse> getCatalogVersion() {
    return ApiResponse.success(catalogVersionService.getVersion());
  }

  @GetMapping
  public ApiResponse<CursorPageDto> list(
      @RequestParam(defaultValue = "25") @Min(1) @Max(500) int limit,
      @RequestParam(required = false) @Size(max = 500) String cursor,
      @RequestParam(required = false) @Size(max = 80) String muscle,
      @RequestParam(required = false) @Size(max = 80) String equipment,
      @RequestParam(required = false) ExerciseType exerciseType,
      @RequestParam(required = false) @Size(max = 20) String level
  ) {
    return ApiResponse.success(exerciseService.list(new ListExercisesQuery(
        limit,
        blankToNull(cursor),
        blankToNull(muscle),
        blankToNull(equipment),
        exerciseType,
        blankToNull(level)
    )));
  }

  @GetMapping("/search")
  public ApiResponse<CursorPageDto> search(
      @RequestParam("q") @NotBlank @Size(min = 2, max = 120) String query,
      @RequestParam(defaultValue = "10") @Min(1) @Max(25) int limit,
      @RequestParam(required = false) @Size(max = 80) String muscle,
      @RequestParam(required = false) @Size(max = 80) String equipment
  ) {
    return ApiResponse.success(exerciseService.search(new SearchExercisesQuery(
        query.trim(),
        limit,
        blankToNull(muscle),
        blankToNull(equipment)
    )));
  }

  @GetMapping("/{exerciseId}")
  public ApiResponse<ExerciseDto> getById(
      @PathVariable String exerciseId,
      @RequestParam(defaultValue = "false") boolean includeContent
  ) {
    ObjectIdValidator.requireValid(exerciseId, "exerciseId");
    return ApiResponse.success(exerciseService.getById(exerciseId, includeContent));
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }
}
