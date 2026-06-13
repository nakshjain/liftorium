package com.liftorium.service;

import com.liftorium.entity.Exercise;
import com.liftorium.entity.ExerciseProviderType;
import com.liftorium.entity.ExerciseSourceInfo;
import com.liftorium.exception.AppException;
import com.liftorium.provider.ExerciseProvider;
import com.liftorium.provider.ExerciseProviderRegistry;
import com.liftorium.provider.ProviderExerciseMetadata;
import com.liftorium.provider.ProviderExercisePage;
import com.liftorium.repository.ExerciseRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExerciseSyncService {

  private static final int PROVIDER_PAGE_SIZE = 100;

  private final ExerciseRepository exerciseRepository;
  private final ExerciseProviderRegistry providerRegistry;
  private final ExerciseCatalogNormalizer normalizer;

  public SyncResult sync(ExerciseProviderType providerType) {
    ExerciseProvider provider = providerRegistry.get(providerType);
    Instant syncStartedAt = Instant.now();
    String cursor = null;
    int created = 0;
    int updated = 0;
    int unchanged = 0;

    do {
      ProviderExercisePage page = provider.fetchPage(cursor, PROVIDER_PAGE_SIZE);
      for (ProviderExerciseMetadata source : page.items()) {
        SyncAction action = upsert(providerType, source, syncStartedAt);
        created += action == SyncAction.CREATED ? 1 : 0;
        updated += action == SyncAction.UPDATED ? 1 : 0;
        unchanged += action == SyncAction.UNCHANGED ? 1 : 0;
      }
      cursor = page.hasNext() ? page.nextCursor() : null;
    } while (cursor != null);

    int deactivated = deactivateMissing(providerType, syncStartedAt);
    return new SyncResult(created, updated, unchanged, deactivated, Instant.now());
  }

  private SyncAction upsert(
      ExerciseProviderType providerType,
      ProviderExerciseMetadata source,
      Instant seenAt
  ) {
    validate(source);
    Exercise existing = exerciseRepository
        .findBySourceProviderAndSourceProviderExerciseId(providerType, source.providerExerciseId())
        .orElse(null);

    if (existing == null) {
      exerciseRepository.save(newExercise(providerType, source, seenAt));
      return SyncAction.CREATED;
    }

    boolean changed = !source.contentFingerprint().equals(existing.getContentFingerprint()) || !existing.isActive();
    if (changed) {
      updateExercise(providerType, existing, source, seenAt);
    } else {
      existing.setLastSeenAt(seenAt);
    }
    exerciseRepository.save(existing);
    return changed ? SyncAction.UPDATED : SyncAction.UNCHANGED;
  }

  private Exercise newExercise(ExerciseProviderType providerType, ProviderExerciseMetadata source, Instant seenAt) {
    return Exercise.builder()
        .name(source.name())
        .normalizedName(normalizer.normalizeName(source.name()))
        .slug(normalizer.slug(source.name(), source.providerExerciseId()))
        .searchPrefixes(normalizer.searchPrefixes(source.name(), List.of()))
        .primaryMuscles(source.primaryMuscles())
        .secondaryMuscles(source.secondaryMuscles())
        .equipment(source.equipment())
        .exerciseType(source.exerciseType())
        .active(true)
        .source(ExerciseSourceInfo.builder()
            .provider(providerType)
            .providerExerciseId(source.providerExerciseId())
            .build())
        .level(source.level())
        .mechanic(source.mechanic())
        .overview(source.overview())
        .instructions(source.instructions() != null ? source.instructions() : List.of())
        .contentFingerprint(source.contentFingerprint())
        .lastSeenAt(seenAt)
        .build();
  }

  private void updateExercise(ExerciseProviderType providerType, Exercise exercise, ProviderExerciseMetadata source, Instant seenAt) {
    exercise.setName(source.name());
    exercise.setNormalizedName(normalizer.normalizeName(source.name()));
    exercise.setSearchPrefixes(normalizer.searchPrefixes(source.name(), List.of()));
    exercise.setPrimaryMuscles(source.primaryMuscles());
    exercise.setSecondaryMuscles(source.secondaryMuscles());
    exercise.setEquipment(source.equipment());
    exercise.setExerciseType(source.exerciseType());
    exercise.setActive(true);
    exercise.setLevel(source.level());
    exercise.setMechanic(source.mechanic());
    exercise.setOverview(source.overview());
    exercise.setInstructions(source.instructions() != null ? source.instructions() : List.of());
    exercise.setContentFingerprint(source.contentFingerprint());
    exercise.setLastSeenAt(seenAt);
  }

  private int deactivateMissing(ExerciseProviderType providerType, Instant syncStartedAt) {
    List<Exercise> missing = exerciseRepository
        .findBySourceProviderAndActiveTrueAndLastSeenAtBefore(providerType, syncStartedAt);

    for (Exercise exercise : missing) {
      exercise.setActive(false);
      exerciseRepository.save(exercise);
    }
    return missing.size();
  }

  private void validate(ProviderExerciseMetadata source) {
    if (
        source.providerExerciseId() == null ||
            source.providerExerciseId().isBlank() ||
            source.name() == null ||
            source.name().isBlank() ||
            source.name().length() > 160
    ) {
      throw new AppException(
          "EXERCISE_PROVIDER_ERROR",
          "Exercise provider returned invalid catalog metadata",
          HttpStatus.BAD_GATEWAY
      );
    }
  }

  public record SyncResult(
      int created,
      int updated,
      int unchanged,
      int deactivated,
      Instant completedAt
  ) {
  }

  private enum SyncAction {
    CREATED,
    UPDATED,
    UNCHANGED
  }
}
