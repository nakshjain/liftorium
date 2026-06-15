package com.liftorium.service;

import com.liftorium.entity.Workout;
import com.liftorium.entity.WorkoutExercise;
import com.liftorium.entity.WorkoutSet;
import com.liftorium.entity.progress.ExerciseProgress;
import com.liftorium.entity.progress.ExerciseProgressHistory;
import com.liftorium.entity.progress.PrEvent;
import com.liftorium.entity.progress.PrType;
import com.liftorium.repository.ExerciseProgressHistoryRepository;
import com.liftorium.repository.ExerciseProgressRepository;
import com.liftorium.repository.PrEventRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Evaluates a completed workout for personal records.
 *
 * <p>Called exactly once per workout, triggered by {@link WorkoutService#finish}.
 * Never invoked during live set entry.
 *
 * <p>PR types:
 * <ul>
 *   <li>WEIGHT — highest weight ever lifted for an exercise</li>
 *   <li>REPS   — highest reps achieved (tracked against the all-time rep count)</li>
 *   <li>ESTIMATED_ONE_REP_MAX — Epley: weight × (1 + reps / 30)</li>
 * </ul>
 *
 * <p>When any PR fires for an exercise in a workout, a single
 * {@link ExerciseProgressHistory} snapshot is created capturing the best
 * metrics from all sets in that session. This snapshot is the source of
 * truth for progression charts.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressEvaluationService {

  private final ExerciseProgressRepository exerciseProgressRepository;
  private final PrEventRepository prEventRepository;
  private final ExerciseProgressHistoryRepository historyRepository;

  public void evaluate(Workout workout) {
    if (workout.getExercises() == null || workout.getExercises().isEmpty()) {
      return;
    }

    String userId = workout.getUserId();
    String workoutId = workout.getId();
    Instant workoutFinishedAt = workout.getFinishedAt() != null
        ? workout.getFinishedAt()
        : Instant.now();

    List<String> exerciseIds = workout.getExercises().stream()
        .map(WorkoutExercise::getExerciseId)
        .distinct()
        .toList();

    Map<String, ExerciseProgress> existingProgress = exerciseProgressRepository
        .findByUserId(userId)
        .stream()
        .filter(ep -> exerciseIds.contains(ep.getExerciseId()))
        .collect(Collectors.toMap(ExerciseProgress::getExerciseId, ep -> ep));

    List<ExerciseProgress> toSave = new ArrayList<>();
    List<PrEvent> newEvents = new ArrayList<>();
    List<ExerciseProgressHistory> newSnapshots = new ArrayList<>();

    for (WorkoutExercise workoutExercise : workout.getExercises()) {
      String exerciseId = workoutExercise.getExerciseId();
      List<WorkoutSet> sets = workoutExercise.getSets();

      if (sets == null || sets.isEmpty()) {
        continue;
      }

      ExerciseProgress progress = existingProgress.computeIfAbsent(
          exerciseId,
          id -> ExerciseProgress.builder()
              .userId(userId)
              .exerciseId(id)
              .build()
      );

      boolean anyPr = evaluateExercise(
          progress, sets, workoutId, workoutFinishedAt, newEvents);

      toSave.add(progress);

      // One snapshot per exercise per workout — only when at least one PR fired.
      if (anyPr && !historyRepository.existsByUserIdAndExerciseIdAndWorkoutId(
          userId, exerciseId, workoutId)) {
        newSnapshots.add(buildSnapshot(userId, exerciseId, workoutId, sets, workoutFinishedAt));
      }
    }

    if (!toSave.isEmpty()) {
      exerciseProgressRepository.saveAll(toSave);
    }
    if (!newEvents.isEmpty()) {
      prEventRepository.saveAll(newEvents);
    }
    if (!newSnapshots.isEmpty()) {
      historyRepository.saveAll(newSnapshots);
    }

    log.debug("Progress evaluation complete for workout {}: {} exercises, {} PRs, {} snapshots",
        workoutId, toSave.size(), newEvents.size(), newSnapshots.size());
  }

  // ── Private helpers ───────────────────────────────────────────────────

  /**
   * Evaluates all sets for one exercise.
   * Mutates {@code progress}, appends PrEvents to {@code newEvents}.
   *
   * @return {@code true} if at least one PR was beaten this session
   */
  private boolean evaluateExercise(
      ExerciseProgress progress,
      List<WorkoutSet> sets,
      String workoutId,
      Instant workoutFinishedAt,
      List<PrEvent> newEvents
  ) {
    boolean anyPr = false;

    for (WorkoutSet set : sets) {
      if (set.getReps() <= 0 || set.getWeight() < 0) {
        continue;
      }

      Instant achievedAt = set.getCompletedAt() != null
          ? set.getCompletedAt()
          : workoutFinishedAt;
      double weight = set.getWeight();
      int reps = set.getReps();

      // ── WEIGHT PR ─────────────────────────────────────────────────
      if (weight > progress.getWeightPr()) {
        progress.setWeightPr(weight);
        progress.setLastImprovedAt(achievedAt);
        progress.setTotalPrs(progress.getTotalPrs() + 1);
        newEvents.add(prEvent(progress, PrType.WEIGHT, weight, workoutId, achievedAt));
        anyPr = true;
      }

      // ── REP PR ────────────────────────────────────────────────────
      if (weight == progress.getRepPrWeight() && reps > progress.getRepPrReps()) {
        progress.setRepPrReps(reps);
        progress.setLastImprovedAt(achievedAt);
        progress.setTotalPrs(progress.getTotalPrs() + 1);
        newEvents.add(prEvent(progress, PrType.REPS, reps, workoutId, achievedAt));
        anyPr = true;
      } else if (progress.getRepPrReps() == 0 || reps > progress.getRepPrReps()) {
        progress.setRepPrWeight(weight);
        progress.setRepPrReps(reps);
        progress.setLastImprovedAt(achievedAt);
        progress.setTotalPrs(progress.getTotalPrs() + 1);
        newEvents.add(prEvent(progress, PrType.REPS, reps, workoutId, achievedAt));
        anyPr = true;
      }

      // ── ESTIMATED 1RM (Epley) ─────────────────────────────────────
      double e1rm = calculateEpley(weight, reps);
      if (e1rm > progress.getEstimatedOneRepMaxPr()) {
        progress.setEstimatedOneRepMaxPr(e1rm);
        progress.setLastImprovedAt(achievedAt);
        progress.setTotalPrs(progress.getTotalPrs() + 1);
        newEvents.add(prEvent(progress, PrType.ESTIMATED_ONE_REP_MAX,
            roundToTwo(e1rm), workoutId, achievedAt));
        anyPr = true;
      }
    }

    return anyPr;
  }

  /**
   * Builds a history snapshot from the best metrics across all sets
   * in this exercise for this workout. The "best set" is the one with
   * the highest estimated 1RM — a single objective measure of performance.
   */
  private ExerciseProgressHistory buildSnapshot(
      String userId,
      String exerciseId,
      String workoutId,
      List<WorkoutSet> sets,
      Instant workoutFinishedAt
  ) {
    double maxWeight = 0;
    double bestE1rm = 0;
    double bestSetWeight = 0;
    int bestSetReps = 0;
    Instant achievedAt = workoutFinishedAt;

    for (WorkoutSet set : sets) {
      if (set.getReps() <= 0 || set.getWeight() < 0) {
        continue;
      }

      double weight = set.getWeight();
      int reps = set.getReps();
      double e1rm = calculateEpley(weight, reps);

      if (weight > maxWeight) {
        maxWeight = weight;
      }

      if (e1rm > bestE1rm) {
        bestE1rm = e1rm;
        bestSetWeight = weight;
        bestSetReps = reps;
        if (set.getCompletedAt() != null) {
          achievedAt = set.getCompletedAt();
        }
      }
    }

    return ExerciseProgressHistory.builder()
        .userId(userId)
        .exerciseId(exerciseId)
        .workoutId(workoutId)
        .maxWeight(maxWeight)
        .bestSetWeight(bestSetWeight)
        .bestSetReps(bestSetReps)
        .estimatedOneRepMax(roundToTwo(bestE1rm))
        .achievedAt(achievedAt)
        .build();
  }

  private PrEvent prEvent(
      ExerciseProgress progress,
      PrType type,
      double value,
      String workoutId,
      Instant achievedAt
  ) {
    return PrEvent.builder()
        .userId(progress.getUserId())
        .exerciseId(progress.getExerciseId())
        .prType(type)
        .value(value)
        .workoutId(workoutId)
        .achievedAt(achievedAt)
        .build();
  }

  private double calculateEpley(double weight, int reps) {
    return weight * (1.0 + reps / 30.0);
  }

  private double roundToTwo(double value) {
    return Math.round(value * 100.0) / 100.0;
  }
}
