package com.liftorium.controller;

import com.liftorium.dto.ApiResponse;
import com.liftorium.dto.ProgressDtos.ExerciseProgressDetailDto;
import com.liftorium.dto.ProgressDtos.ExerciseProgressHistoryDto;
import com.liftorium.dto.ProgressDtos.ListExerciseProgressQuery;
import com.liftorium.dto.ProgressDtos.ListPrEventsQuery;
import com.liftorium.dto.ProgressDtos.PaginatedExerciseProgressDto;
import com.liftorium.dto.ProgressDtos.PaginatedPrEventsDto;
import com.liftorium.dto.ProgressDtos.ProgressOverviewDto;
import com.liftorium.exception.AppException;
import com.liftorium.security.UserPrincipal;
import com.liftorium.service.ProgressService;
import com.liftorium.util.ObjectIdValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("api/v1/progress")
@RequiredArgsConstructor
public class ProgressController {

  private final ProgressService progressService;

  /**
   * GET /progress/overview
   * Summary of the user's lifetime progression: PR counts, exercises improved,
   * latest PR date, and the single strongest exercise by weight PR.
   */
  @GetMapping("/overview")
  public ApiResponse<ProgressOverviewDto> getOverview(
      @AuthenticationPrincipal UserPrincipal principal
  ) {
    return ApiResponse.success(progressService.getOverview(principal.getId()));
  }

  /**
   * GET /progress/exercises
   * Paginated list of exercise progress records.
   * Supports optional search by exercise name.
   */
  @GetMapping("/exercises")
  public ApiResponse<PaginatedExerciseProgressDto> listExerciseProgress(
      @AuthenticationPrincipal UserPrincipal principal,
      @ModelAttribute ListExerciseProgressQuery query
  ) {
    ListExerciseProgressQuery normalised = new ListExerciseProgressQuery(
        query.page() == 0 ? 1 : query.page(),
        query.limit() == 0 ? 20 : query.limit(),
        query.search()
    );
    validatePagination(normalised.page(), normalised.limit());
    return ApiResponse.success(progressService.listExerciseProgress(principal.getId(), normalised));
  }

  /**
   * GET /progress/exercises/{exerciseId}
   * Full progress detail for a single exercise.
   */
  @GetMapping("/exercises/{exerciseId}")
  public ApiResponse<ExerciseProgressDetailDto> getExerciseProgress(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable String exerciseId
  ) {
    ObjectIdValidator.requireValid(exerciseId, "exerciseId");
    return ApiResponse.success(progressService.getExerciseProgress(principal.getId(), exerciseId));
  }

  /**
   * GET /progress/prs
   * Paginated PR event timeline.
   * Filterable by prType and/or exerciseId.
   */
  @GetMapping("/prs")
  public ApiResponse<PaginatedPrEventsDto> listPrEvents(
      @AuthenticationPrincipal UserPrincipal principal,
      @ModelAttribute ListPrEventsQuery query
  ) {
    ListPrEventsQuery normalised = new ListPrEventsQuery(
        query.page() == 0 ? 1 : query.page(),
        query.limit() == 0 ? 20 : query.limit(),
        query.prType(),
        query.exerciseId()
    );
    validatePagination(normalised.page(), normalised.limit());

    if (normalised.exerciseId() != null && !normalised.exerciseId().isBlank()) {
      ObjectIdValidator.requireValid(normalised.exerciseId(), "exerciseId");
    }

    return ApiResponse.success(progressService.listPrEvents(principal.getId(), normalised));
  }

  /**
   * GET /progress/exercises/{exerciseId}/history
   * Full progression history for a single exercise, ordered chronologically.
   * Each entry represents a workout session where at least one PR was achieved.
   * Primary data source for progression charts and trend analytics.
   */
  @GetMapping("/exercises/{exerciseId}/history")
  public ApiResponse<ExerciseProgressHistoryDto> getExerciseProgressHistory(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable String exerciseId
  ) {
    ObjectIdValidator.requireValid(exerciseId, "exerciseId");
    return ApiResponse.success(
        progressService.getExerciseProgressHistory(principal.getId(), exerciseId));
  }

  private void validatePagination(int page, int limit) {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new AppException(
          "VALIDATION_ERROR",
          "Request validation failed",
          HttpStatus.UNPROCESSABLE_ENTITY
      );
    }
  }
}
