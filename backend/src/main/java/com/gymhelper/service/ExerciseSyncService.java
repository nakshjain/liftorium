package com.gymhelper.service;

import com.gymhelper.entity.Exercise;
import com.gymhelper.entity.ExerciseProviderMapping;
import com.gymhelper.entity.ExerciseProviderType;
import com.gymhelper.exception.AppException;
import com.gymhelper.provider.ExerciseProvider;
import com.gymhelper.provider.ExerciseProviderRegistry;
import com.gymhelper.provider.ProviderExerciseMetadata;
import com.gymhelper.provider.ProviderExercisePage;
import com.gymhelper.repository.ExerciseProviderMappingRepository;
import com.gymhelper.repository.ExerciseRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
public class ExerciseSyncService {

  private static final int PROVIDER_PAGE_SIZE = 100;

  private final ExerciseRepository exerciseRepository;
  private final ExerciseProviderMappingRepository mappingRepository;
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
    ExerciseProviderMapping mapping = mappingRepository
        .findByProviderAndProviderExerciseId(providerType, source.providerExerciseId())
        .orElse(null);

    if (mapping == null) {
      Exercise exercise = exerciseRepository.save(newExercise(source));
      mappingRepository.save(ExerciseProviderMapping.builder()
          .provider(providerType)
          .providerExerciseId(source.providerExerciseId())
          .exerciseId(exercise.getId())
          .providerDatasetVersion(source.providerDatasetVersion())
          .providerName(source.name())
          .contentFingerprint(source.contentFingerprint())
          .active(true)
          .preferredForContent(true)
          .firstSeenAt(seenAt)
          .lastSeenAt(seenAt)
          .lastSyncedAt(seenAt)
          .build());
      return SyncAction.CREATED;
    }

    Exercise exercise = exerciseRepository.findById(mapping.getExerciseId()).orElseThrow();
    boolean changed = !source.contentFingerprint().equals(mapping.getContentFingerprint()) || !mapping.isActive();
    if (changed) {
      updateExercise(exercise, source);
      exerciseRepository.save(exercise);
    }

    mapping.setProviderDatasetVersion(source.providerDatasetVersion());
    mapping.setProviderName(source.name());
    mapping.setContentFingerprint(source.contentFingerprint());
    mapping.setActive(true);
    mapping.setMissingSince(null);
    mapping.setLastSeenAt(seenAt);
    mapping.setLastSyncedAt(seenAt);
    mappingRepository.save(mapping);
    return changed ? SyncAction.UPDATED : SyncAction.UNCHANGED;
  }

  private Exercise newExercise(ProviderExerciseMetadata source) {
    return Exercise.builder()
        .name(source.name())
        .normalizedName(normalizer.normalizeName(source.name()))
        .slug(normalizer.slug(source.name(), source.providerExerciseId()))
        .aliases(source.aliases())
        .searchPrefixes(normalizer.searchPrefixes(source.name(), source.aliases()))
        .primaryMuscles(source.primaryMuscles())
        .secondaryMuscles(source.secondaryMuscles())
        .bodyParts(source.bodyParts())
        .equipment(source.equipment())
        .movementPattern(source.movementPattern())
        .exerciseType(source.exerciseType())
        .active(true)
        .build();
  }

  private void updateExercise(Exercise exercise, ProviderExerciseMetadata source) {
    List<String> aliases = new ArrayList<>(exercise.getAliases());
    if (!exercise.getName().equals(source.name()) && !aliases.contains(exercise.getName())) {
      aliases.add(exercise.getName());
    }
    if (aliases.size() > 20) {
      aliases = new ArrayList<>(aliases.subList(aliases.size() - 20, aliases.size()));
    }

    exercise.setName(source.name());
    exercise.setNormalizedName(normalizer.normalizeName(source.name()));
    exercise.setAliases(List.copyOf(aliases));
    exercise.setSearchPrefixes(normalizer.searchPrefixes(source.name(), aliases));
    exercise.setPrimaryMuscles(source.primaryMuscles());
    exercise.setSecondaryMuscles(source.secondaryMuscles());
    exercise.setBodyParts(source.bodyParts());
    exercise.setEquipment(source.equipment());
    exercise.setMovementPattern(source.movementPattern());
    exercise.setExerciseType(source.exerciseType());
    exercise.setActive(true);
  }

  private int deactivateMissing(ExerciseProviderType providerType, Instant syncStartedAt) {
    List<ExerciseProviderMapping> missing = mappingRepository
        .findByProviderAndActiveTrueAndLastSeenAtBefore(providerType, syncStartedAt);

    for (ExerciseProviderMapping mapping : missing) {
      mapping.setActive(false);
      mapping.setMissingSince(syncStartedAt);
      mapping.setLastSyncedAt(syncStartedAt);
      mappingRepository.save(mapping);

      if (!mappingRepository.existsByExerciseIdAndActiveTrue(mapping.getExerciseId())) {
        exerciseRepository.findById(mapping.getExerciseId()).ifPresent(exercise -> {
          exercise.setActive(false);
          exerciseRepository.save(exercise);
        });
      }
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
