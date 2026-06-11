package com.gymhelper.repository;

import com.gymhelper.dto.ExerciseDtos.ListExercisesQuery;
import com.gymhelper.dto.ExerciseDtos.SearchExercisesQuery;
import com.gymhelper.entity.Exercise;
import com.gymhelper.exception.AppException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ExerciseQueryRepository {

  private static final Sort CATALOG_SORT = Sort.by(
      Sort.Order.asc("normalizedName"),
      Sort.Order.asc("_id")
  );

  private final MongoTemplate mongoTemplate;

  public CursorResult list(ListExercisesQuery input) {
    List<Criteria> criteria = baseFilters(
        input.muscle(),
        input.equipment(),
        input.bodyPart(),
        input.exerciseType() == null ? null : input.exerciseType().name(),
        input.movementPattern() == null ? null : input.movementPattern().name()
    );

    if (input.cursor() != null) {
      Cursor cursor = decodeCursor(input.cursor());
      criteria.add(new Criteria().orOperator(
          Criteria.where("normalizedName").gt(cursor.normalizedName()),
          new Criteria().andOperator(
              Criteria.where("normalizedName").is(cursor.normalizedName()),
              Criteria.where("_id").gt(cursor.id())
          )
      ));
    }

    return execute(criteria, input.limit());
  }

  public CursorResult search(SearchExercisesQuery input) {
    List<Criteria> criteria = baseFilters(input.muscle(), input.equipment(), null, null, null);
    criteria.add(Criteria.where("searchPrefixes").is(normalize(input.query())));
    return execute(criteria, input.limit());
  }

  private CursorResult execute(List<Criteria> criteria, int limit) {
    Query query = new Query()
        .addCriteria(new Criteria().andOperator(criteria.toArray(Criteria[]::new)))
        .with(CATALOG_SORT)
        .limit(limit + 1);

    List<Exercise> results = mongoTemplate.find(query, Exercise.class);
    boolean hasNext = results.size() > limit;
    List<Exercise> items = hasNext ? results.subList(0, limit) : results;
    String nextCursor = hasNext ? encodeCursor(items.getLast()) : null;
    return new CursorResult(List.copyOf(items), nextCursor, hasNext);
  }

  private List<Criteria> baseFilters(
      String muscle,
      String equipment,
      String bodyPart,
      String exerciseType,
      String movementPattern
  ) {
    List<Criteria> criteria = new ArrayList<>();
    criteria.add(Criteria.where("active").is(true));

    if (muscle != null) {
      String value = normalize(muscle);
      criteria.add(new Criteria().orOperator(
          Criteria.where("primaryMuscles").is(value),
          Criteria.where("secondaryMuscles").is(value)
      ));
    }
    if (equipment != null) {
      criteria.add(Criteria.where("equipment").is(normalize(equipment)));
    }
    if (bodyPart != null) {
      criteria.add(Criteria.where("bodyParts").is(normalize(bodyPart)));
    }
    if (exerciseType != null) {
      criteria.add(Criteria.where("exerciseType").is(exerciseType));
    }
    if (movementPattern != null) {
      criteria.add(Criteria.where("movementPattern").is(movementPattern));
    }

    return criteria;
  }

  private String encodeCursor(Exercise exercise) {
    String raw = exercise.getNormalizedName() + "\n" + exercise.getId();
    return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
  }

  private Cursor decodeCursor(String encoded) {
    try {
      String raw = new String(Base64.getUrlDecoder().decode(encoded), StandardCharsets.UTF_8);
      String[] parts = raw.split("\n", 2);
      if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()) {
        throw new IllegalArgumentException("Invalid cursor");
      }
      return new Cursor(parts[0], parts[1]);
    } catch (IllegalArgumentException exception) {
      throw new AppException("INVALID_CURSOR", "Exercise cursor is invalid", HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  private String normalize(String value) {
    return value.trim().toLowerCase();
  }

  public record CursorResult(List<Exercise> items, String nextCursor, boolean hasNext) {
  }

  private record Cursor(String normalizedName, String id) {
  }
}
