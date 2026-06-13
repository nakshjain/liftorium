package com.liftorium.controller;

import com.liftorium.dto.ApiResponse;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

  @GetMapping("/")
  public ApiResponse<Map<String, String>> root() {
    return ApiResponse.success(Map.of("app", "Liftorium", "status", "running"));
  }

  @GetMapping("/health")
  public ApiResponse<Map<String, String>> health() {
    return ApiResponse.success(Map.of("status", "ok"));
  }
}
