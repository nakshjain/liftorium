package com.gymhelper.entity;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanDay {

  private int dayOfWeek; // 0 = Mon, 6 = Sun

  private String label;

  @Builder.Default
  private List<String> muscleGroups = new ArrayList<>();

  private boolean rest;
}
