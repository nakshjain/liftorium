package com.gymhelper.provider;

import com.gymhelper.entity.ExerciseProviderType;

public interface ExerciseProvider {

  ExerciseProviderType type();

  ProviderExercisePage fetchPage(String cursor, int limit);

  ProviderExerciseContent fetchContent(String providerExerciseId);
}
