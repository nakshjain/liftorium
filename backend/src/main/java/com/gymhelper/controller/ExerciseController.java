package com.gymhelper.controller;

import com.gymhelper.dto.ApiResponse;
import com.gymhelper.dto.ExerciseDtos.CreateExerciseRequest;
import com.gymhelper.dto.ExerciseDtos.ExerciseDto;
import com.gymhelper.dto.ExerciseDtos.ListExercisesQuery;
import com.gymhelper.dto.ExerciseDtos.PaginatedExercisesDto;
import com.gymhelper.dto.ExerciseDtos.UpdateExerciseRequest;
import com.gymhelper.service.ExerciseService;
import com.gymhelper.util.ObjectIdValidator;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/exercises")
@RequiredArgsConstructor
public class ExerciseController {

  private final ExerciseService exerciseService;

  @GetMapping
  public ApiResponse<PaginatedExercisesDto> list(@ModelAttribute ListExercisesQuery query) {
    ListExercisesQuery normalizedQuery = new ListExercisesQuery(
        query.page() == 0 ? 1 : query.page(),
        query.limit() == 0 ? 20 : query.limit(),
        blankToNull(query.search()),
        blankToNull(query.muscleGroup()),
        blankToNull(query.equipment()),
        blankToNull(query.category())
    );
    validatePagination(normalizedQuery.page(), normalizedQuery.limit());

    return ApiResponse.success(exerciseService.list(normalizedQuery));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<Map<String, ExerciseDto>> create(@Valid @RequestBody CreateExerciseRequest request) {
    return ApiResponse.success(Map.of("exercise", exerciseService.create(request)));
  }

  @GetMapping("/{exerciseId}")
  public ApiResponse<Map<String, ExerciseDto>> getById(@PathVariable String exerciseId) {
    ObjectIdValidator.requireValid(exerciseId, "exerciseId");
    return ApiResponse.success(Map.of("exercise", exerciseService.getById(exerciseId)));
  }

  @PatchMapping("/{exerciseId}")
  public ApiResponse<Map<String, ExerciseDto>> update(
      @PathVariable String exerciseId,
      @Valid @RequestBody UpdateExerciseRequest request
  ) {
    ObjectIdValidator.requireValid(exerciseId, "exerciseId");
    return ApiResponse.success(Map.of("exercise", exerciseService.update(exerciseId, request)));
  }

  @DeleteMapping("/{exerciseId}")
  public ApiResponse<Map<String, Boolean>> delete(@PathVariable String exerciseId) {
    ObjectIdValidator.requireValid(exerciseId, "exerciseId");
    exerciseService.delete(exerciseId);
    return ApiResponse.success(Map.of("deleted", true));
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private void validatePagination(int page, int limit) {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new com.gymhelper.exception.AppException(
          "VALIDATION_ERROR",
          "Request validation failed",
          org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY
      );
    }
  }
}
