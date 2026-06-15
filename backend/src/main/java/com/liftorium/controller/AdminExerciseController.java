package com.liftorium.controller;

import com.liftorium.dto.ApiResponse;
import com.liftorium.dto.ExerciseDtos.SyncResultDto;
import com.liftorium.entity.ExerciseProviderType;
import com.liftorium.service.ExerciseSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/exercises")
@RequiredArgsConstructor
public class AdminExerciseController {

  private final ExerciseSyncService exerciseSyncService;

  @PostMapping("/sync")
  public ApiResponse<SyncResultDto> sync() {
    ExerciseSyncService.SyncResult result = exerciseSyncService.sync(ExerciseProviderType.FREE_EXERCISE_DB);
    return ApiResponse.success(new SyncResultDto(
        result.created(),
        result.updated(),
        result.unchanged(),
        result.deactivated()
    ));
  }
}
