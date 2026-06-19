package com.liftorium.controller;

import com.liftorium.dto.ApiResponse;
import com.liftorium.dto.HistoryInsightsDtos.HistoryInsightsDto;
import com.liftorium.security.UserPrincipal;
import com.liftorium.service.HistoryInsightsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/history")
@RequiredArgsConstructor
public class HistoryInsightsController {

  private final HistoryInsightsService historyInsightsService;

  /**
   * GET /history/insights
   *
   * <p>Returns lightweight activity-focused insights for the History page.
   * Contains only training-frequency data (most trained exercise).
   * Strength / PR data lives exclusively under /progress.
   */
  @GetMapping("/insights")
  public ApiResponse<HistoryInsightsDto> getInsights(
      @AuthenticationPrincipal UserPrincipal principal
  ) {
    return ApiResponse.success(historyInsightsService.getInsights(principal.getId()));
  }
}
