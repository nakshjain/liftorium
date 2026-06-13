package com.liftorium.repository;

import com.liftorium.entity.WorkoutPlan;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface WorkoutPlanRepository extends MongoRepository<WorkoutPlan, String> {

  Optional<WorkoutPlan> findByUserId(String userId);
}
