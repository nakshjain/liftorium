package com.liftorium.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseSourceInfo {

  private ExerciseProviderType provider;
  private String providerExerciseId;
}
