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
public class PlanExercise {

  private String exerciseId;

  private String exerciseName;

  @Builder.Default
  private List<PlanSet> sets = new ArrayList<>();

  private int order;
}
