package com.liftorium.repository;

import com.liftorium.entity.Workout;
import com.liftorium.entity.WorkoutStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface WorkoutRepository extends MongoRepository<Workout, String> {

  Optional<Workout> findFirstByUserIdAndStatusOrderByStartedAtDesc(String userId, WorkoutStatus status);

  Optional<Workout> findByIdAndUserId(String id, String userId);

  Page<Workout> findByUserIdAndStatus(String userId, WorkoutStatus status, Pageable pageable);
}
