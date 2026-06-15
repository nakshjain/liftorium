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
 * Evaluates a completed workout for personal records and progression snapshots.
 *
 * <p>Called exactly once per workout, triggered by {@link WorkoutService#finish}.
 * Never invoked during live set entry.
 *
 * <h3>PR types</h3>
 * <ul>
 *   <li>WEIGHT — highest weight ever lifted for an exercise</li>
 *   <li>REPS   — highest rep count achieved at any weight</li>
 *   <li>ESTIMATED_ONE_REP_MAX — Epley: weight × (1 + reps / 30)</li>
 * </ul>
 *
 * <h3>Progression history</h3>
 * <p>One {@link ExerciseProgressHistory} snapshot is created for every exercise
 * in every completed workout, regardless of whether a PR fired. Each snapshot
 * captures the best metrics (highest weight, best e1RM set) across all sets in
 * that session. This produces a clean chart like 35 → 45 → 47.5 rather than a
 * noisy stream of every intermediate warm-up weight touched.
 *
 * <h3>PR events</h3>
 * <p>Each {@link PrEvent} now carries both {@code previousValue} and {@code newValue},
 * enabling the frontend to render transitions like "35kg → 47.5kg" directly.
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

      evaluateExercise(progress, sets, workoutId, workoutFinishedAt, newEvents);
      toSave.add(progress);

      // Always create one snapshot per exercise per workout — not gated on PRs.
      // This is the source of truth for progression charts.
      if (!historyRepository.existsByUserIdAndExerciseIdAndWorkoutId(
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
   */
  private void evaluateExercise(
      ExerciseProgress progress,
      List<WorkoutSet> sets,
      String workoutId,
      Instant workoutFinishedAt,
      List<PrEvent> newEvents
  ) {
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
        Double previous = progress.getWeightPr() > 0 ? progress.getWeightPr() : null;
        // Set firstWeightPr once — never overwrite
        if (progress.getFirstWeightPr() == null) {
          progress.setFirstWeightPr(previous != null ? previous : weight);
        }
        progress.setWeightPr(weight);
        progress.setLastImprovedAt(achievedAt);
        progress.setTotalPrs(progress.getTotalPrs() + 1);
        newEvents.add(prEvent(progress, PrType.WEIGHT, weight, previous, workoutId, achievedAt));
      }

      // ── REP PR ────────────────────────────────────────────────────
      int previousReps = progress.getRepPrReps();
      if (weight == progress.getRepPrWeight() && reps > progress.getRepPrReps()) {
        progress.setRepPrReps(reps);
        progress.setLastImprovedAt(achievedAt);
        progress.setTotalPrs(progress.getTotalPrs() + 1);
        newEvents.add(prEvent(progress, PrType.REPS, reps,
            previousReps > 0 ? (double) previousReps : null, workoutId, achievedAt));
      } else if (progress.getRepPrReps() == 0 || reps > progress.getRepPrReps()) {
        Double prev = progress.getRepPrReps() > 0 ? (double) progress.getRepPrReps() : null;
        progress.setRepPrWeight(weight);
        progress.setRepPrReps(reps);
        progress.setLastImprovedAt(achievedAt);
        progress.setTotalPrs(progress.getTotalPrs() + 1);
        newEvents.add(prEvent(progress, PrType.REPS, reps, prev, workoutId, achievedAt));
      }

      // ── ESTIMATED 1RM (Epley) ─────────────────────────────────────
      double e1rm = calculateEpley(weight, reps);
      if (e1rm > progress.getEstimatedOneRepMaxPr()) {
        Double previous1rm = progress.getEstimatedOneRepMaxPr() > 0
            ? roundToTwo(progress.getEstimatedOneRepMaxPr())
            : null;
        // Set firstEstimatedOneRepMax once — never overwrite
        if (progress.getFirstEstimatedOneRepMax() == null) {
          progress.setFirstEstimatedOneRepMax(
              previous1rm != null ? previous1rm : roundToTwo(e1rm));
        }
        progress.setEstimatedOneRepMaxPr(e1rm);
        progress.setLastImprovedAt(achievedAt);
        progress.setTotalPrs(progress.getTotalPrs() + 1);
        newEvents.add(prEvent(progress, PrType.ESTIMATED_ONE_REP_MAX,
            roundToTwo(e1rm), previous1rm, workoutId, achievedAt));
      }
    }
  }

  /**
   * Builds a history snapshot from the best metrics across all sets
   * in this exercise for this workout.
   *
   * <p>Best weight = highest weight lifted in any set.
   * Best set = the set with the highest estimated 1RM (objective performance measure).
   */
  private ExerciseProgressHistory buildSnapshot(
      String userId,
      String exerciseId,
      String workoutId,
      List<WorkoutSet> sets,
      Instant workoutFinishedAt
  ) {
    double bestWeight = 0;
    double bestE1rm = 0;
    double bestSetWeight = 0;
    int bestSetReps = 0;

    for (WorkoutSet set : sets) {
      if (set.getReps() <= 0 || set.getWeight() < 0) {
        continue;
      }

      double weight = set.getWeight();
      int reps = set.getReps();
      double e1rm = calculateEpley(weight, reps);

      if (weight > bestWeight) {
        bestWeight = weight;
      }

      if (e1rm > bestE1rm) {
        bestE1rm = e1rm;
        bestSetWeight = weight;
        bestSetReps = reps;
      }
    }

    return ExerciseProgressHistory.builder()
        .userId(userId)
        .exerciseId(exerciseId)
        .workoutId(workoutId)
        .bestWeight(bestWeight)
        .bestSetWeight(bestSetWeight)
        .bestSetReps(bestSetReps)
        .estimatedOneRepMax(roundToTwo(bestE1rm))
        .performedAt(workoutFinishedAt)
        .build();
  }

  private PrEvent prEvent(
      ExerciseProgress progress,
      PrType type,
      double value,
      Double previousValue,
      String workoutId,
      Instant achievedAt
  ) {
    return PrEvent.builder()
        .userId(progress.getUserId())
        .exerciseId(progress.getExerciseId())
        .prType(type)
        .value(value)
        .previousValue(previousValue)
        .newValue(value)
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
