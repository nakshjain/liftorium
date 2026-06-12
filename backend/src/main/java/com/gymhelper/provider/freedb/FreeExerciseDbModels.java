package com.gymhelper.provider.freedb;

import java.util.List;

public final class FreeExerciseDbModels {

  private FreeExerciseDbModels() {
  }

  public record Exercise(
      String id,
      String name,
      String force,
      String level,
      String mechanic,
      String equipment,
      List<String> primaryMuscles,
      List<String> secondaryMuscles,
      List<String> instructions,
      String category,
      List<String> images
  ) {
  }
}
