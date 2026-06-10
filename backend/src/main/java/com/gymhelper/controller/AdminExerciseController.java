package com.gymhelper.controller;

import com.gymhelper.dto.ApiResponse;
import com.gymhelper.dto.ExerciseDtos.SyncResultDto;
import com.gymhelper.entity.ExerciseProviderType;
import com.gymhelper.service.ExerciseSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/exercises")
@RequiredArgsConstructor
public class AdminExerciseController {

  private final ExerciseSyncService exerciseSyncService;

  @PostMapping("/sync")
  public ApiResponse<SyncResultDto> sync(
      @RequestParam(defaultValue = "ASCEND_API") ExerciseProviderType provider
  ) {
    ExerciseSyncService.SyncResult result = exerciseSyncService.sync(provider);
    return ApiResponse.success(new SyncResultDto(
        result.created(),
        result.updated(),
        result.unchanged(),
        result.deactivated()
    ));
  }
}
