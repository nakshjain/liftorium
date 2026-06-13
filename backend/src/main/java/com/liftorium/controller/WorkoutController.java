package com.liftorium.controller;

import com.liftorium.dto.ApiResponse;
import com.liftorium.dto.WorkoutDtos.AddWorkoutExerciseRequest;
import com.liftorium.dto.WorkoutDtos.AddWorkoutSetRequest;
import com.liftorium.dto.WorkoutDtos.FinishWorkoutRequest;
import com.liftorium.dto.WorkoutDtos.ListWorkoutHistoryQuery;
import com.liftorium.dto.WorkoutDtos.PaginatedWorkoutsDto;
import com.liftorium.dto.WorkoutDtos.StartWorkoutRequest;
import com.liftorium.dto.WorkoutDtos.WorkoutDto;
import com.liftorium.security.UserPrincipal;
import com.liftorium.service.WorkoutService;
import com.liftorium.util.ObjectIdValidator;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/workouts")
@RequiredArgsConstructor
public class WorkoutController {

  private final WorkoutService workoutService;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<Map<String, WorkoutDto>> start(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody StartWorkoutRequest request
  ) {
    return ApiResponse.success(Map.of("workout", workoutService.start(principal.getId(), request)));
  }

  @GetMapping("/active")
  public ApiResponse<Map<String, WorkoutDto>> getActive(@AuthenticationPrincipal UserPrincipal principal) {
    Map<String, WorkoutDto> data = new HashMap<>();
    data.put("workout", workoutService.getActive(principal.getId()));
    return ApiResponse.success(data);
  }

  @GetMapping("/history")
  public ApiResponse<PaginatedWorkoutsDto> listHistory(
      @AuthenticationPrincipal UserPrincipal principal,
      @ModelAttribute ListWorkoutHistoryQuery query
  ) {
    ListWorkoutHistoryQuery normalizedQuery = new ListWorkoutHistoryQuery(
        query.page() == 0 ? 1 : query.page(),
        query.limit() == 0 ? 20 : query.limit()
    );
    validatePagination(normalizedQuery.page(), normalizedQuery.limit());

    return ApiResponse.success(workoutService.listHistory(principal.getId(), normalizedQuery));
  }

  @GetMapping("/{workoutId}")
  public ApiResponse<Map<String, WorkoutDto>> getById(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable String workoutId
  ) {
    ObjectIdValidator.requireValid(workoutId, "workoutId");
    return ApiResponse.success(Map.of("workout", workoutService.getById(principal.getId(), workoutId)));
  }

  @PostMapping("/{workoutId}/exercises")
  public ApiResponse<Map<String, WorkoutDto>> addExercise(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable String workoutId,
      @Valid @RequestBody AddWorkoutExerciseRequest request
  ) {
    ObjectIdValidator.requireValid(workoutId, "workoutId");
    ObjectIdValidator.requireValid(request.exerciseId(), "exerciseId");
    return ApiResponse.success(Map.of("workout", workoutService.addExercise(principal.getId(), workoutId, request)));
  }

  @PostMapping("/{workoutId}/exercises/{workoutExerciseId}/sets")
  public ApiResponse<Map<String, WorkoutDto>> addSet(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable String workoutId,
      @PathVariable String workoutExerciseId,
      @Valid @RequestBody AddWorkoutSetRequest request
  ) {
    ObjectIdValidator.requireValid(workoutId, "workoutId");
    ObjectIdValidator.requireValid(workoutExerciseId, "workoutExerciseId");
    return ApiResponse.success(Map.of("workout", workoutService.addSet(principal.getId(), workoutId, workoutExerciseId, request)));
  }

  @DeleteMapping("/{workoutId}/exercises/{workoutExerciseId}/sets/{setId}")
  public ApiResponse<Map<String, WorkoutDto>> removeSet(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable String workoutId,
      @PathVariable String workoutExerciseId,
      @PathVariable String setId
  ) {
    ObjectIdValidator.requireValid(workoutId, "workoutId");
    ObjectIdValidator.requireValid(workoutExerciseId, "workoutExerciseId");
    ObjectIdValidator.requireValid(setId, "setId");
    return ApiResponse.success(Map.of("workout", workoutService.removeSet(principal.getId(), workoutId, workoutExerciseId, setId)));
  }

  @PostMapping("/{workoutId}/finish")
  public ApiResponse<Map<String, WorkoutDto>> finish(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable String workoutId,
      @Valid @RequestBody FinishWorkoutRequest request
  ) {
    ObjectIdValidator.requireValid(workoutId, "workoutId");
    return ApiResponse.success(Map.of("workout", workoutService.finish(principal.getId(), workoutId, request)));
  }

  private void validatePagination(int page, int limit) {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new com.liftorium.exception.AppException(
          "VALIDATION_ERROR",
          "Request validation failed",
          org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY
      );
    }
  }
}
