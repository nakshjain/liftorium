package com.gymhelper.entity;

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

  private int sets;

  private int reps;

  private int order;
}
