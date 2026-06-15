package com.liftorium.repository;

import com.liftorium.entity.progress.ExerciseProgressHistory;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ExerciseProgressHistoryRepository extends MongoRepository<ExerciseProgressHistory, String> {

  /**
   * Returns the full progression history for a user's exercise, ordered
   * chronologically ascending — the natural order for a progression chart.
   */
  List<ExerciseProgressHistory> findByUserIdAndExerciseIdOrderByPerformedAtAsc(
      String userId, String exerciseId);

  /** Guard against duplicate snapshots for the same workout + exercise. */
  boolean existsByUserIdAndExerciseIdAndWorkoutId(
      String userId, String exerciseId, String workoutId);
}
