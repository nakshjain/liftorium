package com.gymhelper.repository;

import com.gymhelper.entity.Exercise;
import com.gymhelper.entity.ExerciseProviderType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ExerciseRepository extends MongoRepository<Exercise, String> {

  Optional<Exercise> findByIdAndActiveTrue(String id);

  Optional<Exercise> findBySourceProviderAndSourceProviderExerciseId(
      ExerciseProviderType provider, String providerExerciseId);

  List<Exercise> findBySourceProviderAndActiveTrueAndLastSeenAtBefore(
      ExerciseProviderType provider, Instant before);
}
