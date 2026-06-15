package com.liftorium.service;

import com.liftorium.dto.HistoryInsightsDtos.HistoryInsightsDto;
import com.liftorium.dto.HistoryInsightsDtos.MostTrainedExerciseDto;
import com.liftorium.entity.Exercise;
import com.liftorium.entity.WorkoutStatus;
import com.liftorium.repository.ExerciseRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HistoryInsightsService {

  private final MongoTemplate mongoTemplate;
  private final ExerciseRepository exerciseRepository;

  /**
   * Returns activity-focused insights for the History page.
   *
   * <p>Most Trained Exercise is determined by the number of <em>distinct completed
   * workout sessions</em> in which the exercise appeared — not by sets, reps, or
   * volume. This reflects training frequency, which is an activity metric rather
   * than a strength metric.
   */
  public HistoryInsightsDto getInsights(String userId) {
    MostTrainedExerciseDto mostTrained = computeMostTrainedExercise(userId);
    return new HistoryInsightsDto(mostTrained);
  }

  /**
   * Aggregates workout documents at the DB layer:
   * <ol>
   *   <li>Match completed workouts for this user</li>
   *   <li>Unwind the embedded exercises array</li>
   *   <li>Group by exerciseId, counting distinct workouts</li>
   *   <li>Sort descending by sessionCount and take the top result</li>
   * </ol>
   */
  private MostTrainedExerciseDto computeMostTrainedExercise(String userId) {
    Aggregation agg = Aggregation.newAggregation(
        Aggregation.match(
            Criteria.where("userId").is(userId)
                .and("status").is(WorkoutStatus.completed.name())
        ),
        Aggregation.unwind("exercises"),
        Aggregation.group("exercises.exerciseId")
            .count().as("sessionCount"),
        Aggregation.sort(Sort.by(Sort.Direction.DESC, "sessionCount")),
        Aggregation.limit(1)
    );

    AggregationResults<Document> results =
        mongoTemplate.aggregate(agg, "workouts", Document.class);

    List<Document> docs = results.getMappedResults();
    if (docs.isEmpty()) {
      return null;
    }

    Document doc = docs.getFirst();
    String exerciseId = doc.getString("_id");
    long sessionCount = ((Number) doc.get("sessionCount")).longValue();

    String exerciseName = exerciseRepository.findById(exerciseId)
        .map(Exercise::getName)
        .orElse("Unknown");

    return new MostTrainedExerciseDto(exerciseId, exerciseName, sessionCount);
  }
}
