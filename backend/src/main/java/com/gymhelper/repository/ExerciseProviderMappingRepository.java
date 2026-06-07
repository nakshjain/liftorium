package com.gymhelper.repository;

import com.gymhelper.entity.ExerciseProviderMapping;
import com.gymhelper.entity.ExerciseProviderType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ExerciseProviderMappingRepository extends MongoRepository<ExerciseProviderMapping, String> {

  Optional<ExerciseProviderMapping> findByProviderAndProviderExerciseId(
      ExerciseProviderType provider,
      String providerExerciseId
  );

  Optional<ExerciseProviderMapping> findFirstByExerciseIdAndActiveTrueOrderByPreferredForContentDescProviderAsc(
      String exerciseId
  );

  List<ExerciseProviderMapping> findByProviderAndActiveTrueAndLastSeenAtBefore(
      ExerciseProviderType provider,
      Instant syncStartedAt
  );

  boolean existsByExerciseIdAndActiveTrue(String exerciseId);
}
