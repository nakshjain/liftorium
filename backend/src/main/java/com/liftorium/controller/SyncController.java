package com.liftorium.controller;

import com.liftorium.dto.ApiResponse;
import com.liftorium.dto.WorkoutDtos.SyncBulkRequest;
import com.liftorium.dto.WorkoutDtos.SyncBulkResponse;
import com.liftorium.security.UserPrincipal;
import com.liftorium.service.WorkoutSyncService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workouts")
@RequiredArgsConstructor
public class SyncController {

  private final WorkoutSyncService workoutSyncService;

  @PostMapping("/sync")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<ApiResponse<SyncBulkResponse>> sync(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestBody @Valid SyncBulkRequest request
  ) {
    SyncBulkResponse result = workoutSyncService.sync(userPrincipal.getId(), request);
    return ResponseEntity.ok(ApiResponse.success(result));
  }
}
