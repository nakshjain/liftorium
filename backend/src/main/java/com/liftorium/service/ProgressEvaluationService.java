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
 * <h3>Two-phase evaluation</h3>
 * <p><b>Phase 1 — Session reduction:</b> all sets for an exercise are collapsed
 * into a single {@link SessionRecord} representing the best the athlete achieved
 * in that session:
 * <ul>
 *   <li>Session max weight — highest weight lifted in any set</li>
 *   <li>Session best rep set — highest reps; ties broken by higher weight</li>
 *   <li>Session best e1RM — Epley formula across all sets, highest wins</li>
 * </ul>
 *
 * <p><b>Phase 2 — Historical comparison:</b> the session record is compared once
 * against the stored {@link ExerciseProgress}. At most one PR event is emitted
 * per type (WEIGHT / REPS / ESTIMATED_ONE_REP_MAX) per exercise per workout.
 * This prevents warm-up sets from generating spurious PR events and ensures the
 * progression chart shows 35 → 45 instead of 20 → 25 → 30 → 35 → 40 → 45.
 *
 * <h3>Progression history</h3>
 * <p>One {@link ExerciseProgressHistory} snapshot is always created for every
 * exercise in every completed workout, regardless of whether a PR fired. This is
 * the source of truth for weight progression charts.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressEvaluationService {

  private final ExerciseProgressRepository exerciseProgressRepository;
  private final PrEventRepository prEventRepository;
  private final ExerciseProgressHistoryRepository historyRepository;

  // ── Public entry point ────────────────────────────────────────────────

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

      // Phase 1 — reduce all sets to a single session record
      SessionRecord session = buildSessionRecord(sets);
      if (!session.hasValidSets()) {
        continue;
      }

      ExerciseProgress progress = existingProgress.computeIfAbsent(
          exerciseId,
          id -> ExerciseProgress.builder()
              .userId(userId)
              .exerciseId(id)
              .build()
      );

      // Phase 2 — compare session record against history, emit ≤1 event per PR type
      evaluateSession(progress, session, workoutId, workoutFinishedAt, newEvents);
      toSave.add(progress);

      // One history snapshot per exercise per workout — unconditional, not PR-gated
      if (!historyRepository.existsByUserIdAndExerciseIdAndWorkoutId(userId, exerciseId, workoutId)) {
        newSnapshots.add(toSnapshot(userId, exerciseId, workoutId, session, workoutFinishedAt));
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

  // ── Phase 1: Session reduction ────────────────────────────────────────

  /**
   * Reduces all sets in one exercise to a single session-level record.
   * Iterates once; O(n) over the set list.
   */
  private SessionRecord buildSessionRecord(List<WorkoutSet> sets) {
    double sessionMaxWeight = 0;
    double sessionBestRepWeight = 0;
    int sessionBestRepReps = 0;
    double sessionBestE1rm = 0;
    double sessionBestE1rmWeight = 0;
    int sessionBestE1rmReps = 0;

    for (WorkoutSet set : sets) {
      if (set.getReps() <= 0 || set.getWeight() < 0) {
        continue;
      }

      double weight = set.getWeight();
      int reps = set.getReps();
      double e1rm = calculateEpley(weight, reps);

      // Session max weight
      if (weight > sessionMaxWeight) {
        sessionMaxWeight = weight;
      }

      // Session best rep set: more reps wins; ties go to higher weight
      if (reps > sessionBestRepReps
          || (reps == sessionBestRepReps && weight > sessionBestRepWeight)) {
        sessionBestRepReps = reps;
        sessionBestRepWeight = weight;
      }

      // Session best e1RM
      if (e1rm > sessionBestE1rm) {
        sessionBestE1rm = e1rm;
        sessionBestE1rmWeight = weight;
        sessionBestE1rmReps = reps;
      }
    }

    return new SessionRecord(
        sessionMaxWeight,
        sessionBestRepWeight,
        sessionBestRepReps,
        sessionBestE1rm,
        sessionBestE1rmWeight,
        sessionBestE1rmReps
    );
  }

  // ── Phase 2: Historical comparison ───────────────────────────────────

  /**
   * Compares the session-level record against the athlete's all-time progress.
   * Fires at most one PR event per type. Mutates {@code progress} in place.
   */
  private void evaluateSession(
      ExerciseProgress progress,
      SessionRecord session,
      String workoutId,
      Instant achievedAt,
      List<PrEvent> newEvents
  ) {
    // ── WEIGHT PR ─────────────────────────────────────────────────────
    if (session.maxWeight() > progress.getWeightPr()) {
      Double previous = progress.getWeightPr() > 0 ? progress.getWeightPr() : null;

      if (progress.getFirstWeightPr() == null) {
        // First ever weight PR — record the starting value
        progress.setFirstWeightPr(previous != null ? previous : session.maxWeight());
      }

      progress.setWeightPr(session.maxWeight());
      progress.setLastImprovedAt(achievedAt);
      progress.setTotalPrs(progress.getTotalPrs() + 1);
      newEvents.add(prEvent(progress, PrType.WEIGHT,
          previous, session.maxWeight(), null, null, workoutId, achievedAt));
    }

    // ── REP PR ────────────────────────────────────────────────────────
    // Higher reps wins; if equal reps, higher weight wins.
    boolean repPr = session.bestRepReps() > progress.getRepPrReps()
        || (session.bestRepReps() == progress.getRepPrReps()
            && session.bestRepReps() > 0
            && session.bestRepWeight() > progress.getRepPrWeight());

    if (repPr) {
      Double prevReps = progress.getRepPrReps() > 0 ? (double) progress.getRepPrReps() : null;
      Double prevRepWeight = progress.getRepPrWeight() > 0 ? progress.getRepPrWeight() : null;

      progress.setRepPrWeight(session.bestRepWeight());
      progress.setRepPrReps(session.bestRepReps());
      progress.setLastImprovedAt(achievedAt);
      progress.setTotalPrs(progress.getTotalPrs() + 1);
      newEvents.add(prEvent(progress, PrType.REPS,
          prevReps, (double) session.bestRepReps(),
          prevRepWeight, session.bestRepWeight(),
          workoutId, achievedAt));
    }

    // ── ESTIMATED 1RM PR ──────────────────────────────────────────────
    if (session.bestE1rm() > progress.getEstimatedOneRepMaxPr()) {
      Double previous1rm = progress.getEstimatedOneRepMaxPr() > 0
          ? roundToTwo(progress.getEstimatedOneRepMaxPr())
          : null;

      if (progress.getFirstEstimatedOneRepMax() == null) {
        progress.setFirstEstimatedOneRepMax(
            previous1rm != null ? previous1rm : roundToTwo(session.bestE1rm()));
      }

      progress.setEstimatedOneRepMaxPr(session.bestE1rm());
      progress.setLastImprovedAt(achievedAt);
      progress.setTotalPrs(progress.getTotalPrs() + 1);
      newEvents.add(prEvent(progress, PrType.ESTIMATED_ONE_REP_MAX,
          previous1rm, roundToTwo(session.bestE1rm()), null, null, workoutId, achievedAt));
    }
  }

  // ── Snapshot builder ─────────────────────────────────────────────────

  /** Converts a session record to an append-only history document. */
  private ExerciseProgressHistory toSnapshot(
      String userId,
      String exerciseId,
      String workoutId,
      SessionRecord session,
      Instant performedAt
  ) {
    return ExerciseProgressHistory.builder()
        .userId(userId)
        .exerciseId(exerciseId)
        .workoutId(workoutId)
        .bestWeight(session.maxWeight())
        .bestSetWeight(session.bestE1rmWeight())
        .bestSetReps(session.bestE1rmReps())
        .estimatedOneRepMax(roundToTwo(session.bestE1rm()))
        .performedAt(performedAt)
        .build();
  }

  // ── PrEvent factory ──────────────────────────────────────────────────

  private PrEvent prEvent(
      ExerciseProgress progress,
      PrType type,
      Double previousValue,
      Double newValue,
      Double prevRepWeight,
      Double newRepWeight,
      String workoutId,
      Instant achievedAt
  ) {
    return PrEvent.builder()
        .userId(progress.getUserId())
        .exerciseId(progress.getExerciseId())
        .prType(type)
        .previousValue(previousValue)
        .newValue(newValue)
        .prevRepWeight(prevRepWeight)
        .newRepWeight(newRepWeight)
        .workoutId(workoutId)
        .achievedAt(achievedAt)
        .build();
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private double calculateEpley(double weight, int reps) {
    return weight * (1.0 + reps / 30.0);
  }

  private double roundToTwo(double value) {
    return Math.round(value * 100.0) / 100.0;
  }

  // ── Value object ─────────────────────────────────────────────────────

  /**
   * Immutable session-level record for a single exercise in one workout.
   * Built by Phase 1; consumed by Phase 2 and the snapshot builder.
   */
  private record SessionRecord(
      double maxWeight,
      double bestRepWeight,
      int bestRepReps,
      double bestE1rm,
      double bestE1rmWeight,
      int bestE1rmReps
  ) {
    /** True if at least one valid set was recorded this session. */
    boolean hasValidSets() {
      return maxWeight > 0 || bestRepReps > 0;
    }
  }
}
