package com.liftorium.provider;

import com.liftorium.entity.ExerciseProviderType;

public interface ExerciseProvider {

  ExerciseProviderType type();

  ProviderExercisePage fetchPage(String cursor, int limit);
}
