package com.liftorium.dto;

public final class HistoryInsightsDtos {

  private HistoryInsightsDtos() {}

  /**
   * Lightweight activity-focused insights for the History page.
   * Contains only training-frequency metrics — no strength or PR data.
   */
  public record HistoryInsightsDto(
      MostTrainedExerciseDto mostTrainedExercise
  ) {}

  /**
   * The exercise that appeared in the highest number of distinct completed
   * workout sessions for the user. Null when no sessions exist yet.
   */
  public record MostTrainedExerciseDto(
      String exerciseId,
      String exerciseName,
      long sessionCount
  ) {}
}
