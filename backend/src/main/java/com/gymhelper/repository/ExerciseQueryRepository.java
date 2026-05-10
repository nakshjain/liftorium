package com.gymhelper.repository;

import com.gymhelper.dto.ExerciseDtos.ListExercisesQuery;
import com.gymhelper.entity.Exercise;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ExerciseQueryRepository {

  private final MongoTemplate mongoTemplate;

  public Page<Exercise> list(ListExercisesQuery query) {
    List<Criteria> criteria = new ArrayList<>();

    if (query.search() != null) {
      criteria.add(Criteria.where("name").regex(query.search(), "i"));
    }

    if (query.category() != null) {
      criteria.add(Criteria.where("category").is(query.category()));
    }

    if (query.equipment() != null) {
      criteria.add(Criteria.where("equipment").is(query.equipment()));
    }

    if (query.muscleGroup() != null) {
      criteria.add(new Criteria().orOperator(
          Criteria.where("targetMuscles").is(query.muscleGroup()),
          Criteria.where("secondaryMuscles").is(query.muscleGroup())
      ));
    }

    Query mongoQuery = new Query();
    if (!criteria.isEmpty()) {
      mongoQuery.addCriteria(new Criteria().andOperator(criteria.toArray(Criteria[]::new)));
    }

    long total = mongoTemplate.count(mongoQuery, Exercise.class);
    PageRequest pageRequest = PageRequest.of(query.page() - 1, query.limit(), Sort.by("name").ascending());
    mongoQuery.with(pageRequest);

    return new PageImpl<>(mongoTemplate.find(mongoQuery, Exercise.class), pageRequest, total);
  }
}
