package com.liftorium.repository;

import com.liftorium.entity.progress.ExerciseProgress;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ExerciseProgressRepository extends MongoRepository<ExerciseProgress, String> {

  Optional<ExerciseProgress> findByUserIdAndExerciseId(String userId, String exerciseId);

  Page<ExerciseProgress> findByUserId(String userId, Pageable pageable);

  /** Full-text-style search by exerciseIds resolved upstream from an exercise search. */
  Page<ExerciseProgress> findByUserIdAndExerciseIdIn(String userId, List<String> exerciseIds, Pageable pageable);

  List<ExerciseProgress> findByUserId(String userId);

  /** Used for overview: find the record with the highest weightPr for a user. */
  Optional<ExerciseProgress> findFirstByUserIdOrderByWeightPrDesc(String userId);

  long countByUserId(String userId);
}
