package com.liftorium.repository;

import com.liftorium.entity.Exercise;
import com.liftorium.entity.ExerciseProviderType;
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

  /** Used by ProgressService to search exercises by name for the list endpoint. */
  List<Exercise> findByNameContainingIgnoreCase(String name);

  /** Returns the count of active exercises — used for catalog version computation. */
  long countByActiveTrue();

  /** Returns the most recently updated active exercise — used for catalog version computation. */
  Optional<Exercise> findTopByActiveTrueOrderByUpdatedAtDesc();
}
