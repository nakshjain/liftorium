package com.gymhelper.repository;

import com.gymhelper.entity.Workout;
import com.gymhelper.entity.WorkoutStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface WorkoutRepository extends MongoRepository<Workout, String> {

  Optional<Workout> findFirstByUserIdAndStatusOrderByStartedAtDesc(String userId, WorkoutStatus status);

  Optional<Workout> findByIdAndUserId(String id, String userId);

  Page<Workout> findByUserIdAndStatus(String userId, WorkoutStatus status, Pageable pageable);

  Page<Workout> findByUserIdAndStatusAndStartedAtBetween(
      String userId, WorkoutStatus status, Instant from, Instant to, Pageable pageable);

  List<Workout> findByUserIdAndStatusAndStartedAtBetween(
      String userId, WorkoutStatus status, Instant from, Instant to);

  List<Workout> findByUserIdAndStatusOrderByStartedAtDesc(String userId, WorkoutStatus status);
}
