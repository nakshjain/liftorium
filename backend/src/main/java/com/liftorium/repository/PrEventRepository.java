package com.liftorium.repository;

import com.liftorium.entity.progress.PrEvent;
import com.liftorium.entity.progress.PrType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PrEventRepository extends MongoRepository<PrEvent, String> {

  Page<PrEvent> findByUserId(String userId, Pageable pageable);

  Page<PrEvent> findByUserIdAndPrType(String userId, PrType prType, Pageable pageable);

  Page<PrEvent> findByUserIdAndExerciseId(String userId, String exerciseId, Pageable pageable);

  Page<PrEvent> findByUserIdAndExerciseIdAndPrType(
      String userId, String exerciseId, PrType prType, Pageable pageable);

  long countByUserId(String userId);

  Optional<PrEvent> findFirstByUserIdOrderByAchievedAtDesc(String userId);
}
