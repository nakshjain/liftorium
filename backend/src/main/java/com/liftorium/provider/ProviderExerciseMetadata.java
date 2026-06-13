package com.liftorium.provider;

import com.liftorium.entity.ExerciseType;
import java.util.List;

public record ProviderExerciseMetadata(
    String providerExerciseId,
    String name,
    List<String> primaryMuscles,
    List<String> secondaryMuscles,
    List<String> equipment,
    ExerciseType exerciseType,
    String providerDatasetVersion,
    String contentFingerprint,
    String overview,
    List<String> instructions,
    String level,
    String mechanic
) {
}
