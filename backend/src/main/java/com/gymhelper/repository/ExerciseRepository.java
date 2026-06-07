package com.gymhelper.repository;

import com.gymhelper.entity.Exercise;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ExerciseRepository extends MongoRepository<Exercise, String> {

  Optional<Exercise> findByIdAndActiveTrue(String id);
}
