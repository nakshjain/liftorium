package com.gymhelper.provider;

import com.gymhelper.entity.ExerciseType;
import com.gymhelper.entity.MovementPattern;
import java.util.List;

public record ProviderExerciseMetadata(
    String providerExerciseId,
    String name,
    List<String> aliases,
    List<String> primaryMuscles,
    List<String> secondaryMuscles,
    List<String> bodyParts,
    List<String> equipment,
    MovementPattern movementPattern,
    ExerciseType exerciseType,
    String providerDatasetVersion,
    String contentFingerprint,
    String overview,
    List<String> instructions,
    List<String> tips
) {
}
