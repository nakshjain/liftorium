package com.liftorium.controller;

import com.liftorium.dto.ApiResponse;
import com.liftorium.dto.PlanDtos.TemplateDto;
import com.liftorium.dto.PlanDtos.UpsertPlanRequest;
import com.liftorium.dto.PlanDtos.WorkoutPlanDto;
import com.liftorium.security.UserPrincipal;
import com.liftorium.service.WorkoutPlanService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/plan")
@RequiredArgsConstructor
public class WorkoutPlanController {

  private final WorkoutPlanService planService;

  @GetMapping
  public ApiResponse<Map<String, WorkoutPlanDto>> get(@AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.success(Map.of("plan", planService.get(principal.getId())));
  }

  @GetMapping("/templates")
  public ApiResponse<Map<String, List<TemplateDto>>> getTemplates() {
    return ApiResponse.success(Map.of("templates", planService.getTemplates()));
  }

  @PutMapping
  public ApiResponse<Map<String, WorkoutPlanDto>> upsert(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody UpsertPlanRequest request
  ) {
    return ApiResponse.success(Map.of("plan", planService.upsert(principal.getId(), request)));
  }
}
