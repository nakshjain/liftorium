package com.liftorium.service;

import com.liftorium.entity.TrackingType;
import com.liftorium.entity.Workout;
import com.liftorium.entity.WorkoutExercise;
import com.liftorium.entity.WorkoutSet;
import com.liftorium.entity.progress.ExerciseProgress;
import com.liftorium.entity.progress.ExerciseProgressHistory;
import com.liftorium.entity.progress.PrEvent;
import com.liftorium.entity.progress.PrType;
import com.liftorium.repository.ExerciseProgressHistoryRepository;
import com.liftorium.repository.ExerciseProgressRepository;
import com.liftorium.repository.ExerciseRepository;
import com.liftorium.repository.PrEventRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
 * in that session. Which metrics are computed depends on the exercise's
 * {@link TrackingType}:
 * <ul>
 *   <li>WEIGHT_REPS — max weight, best rep set, best e1RM</li>
 *   <li>REPS_ONLY   — best rep set (weight ignored)</li>
 *   <li>DURATION    — longest duration</li>
 *   <li>CARDIO      — longest duration, longest distance</li>
 * </ul>
 *
 * <p><b>Phase 2 — Historical comparison:</b> the session record is compared once
 * against the stored {@link ExerciseProgress}. At most one PR event is emitted
 * per type per exercise per workout.
 *
 * <h3>Progression history</h3>
 * <p>One {@link ExerciseProgressHistory} snapshot is always created for every
 * exercise in every completed workout, regardless of whether a PR fired.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressEvaluationService {

  private final ExerciseProgressRepository exerciseProgressRepository;
  private final PrEventRepository prEventRepository;
  private final ExerciseProgressHistoryRepository historyRepository;
  private final ExerciseRepository exerciseRepository;

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

    // Resolve TrackingType for every exercise in this workout in one query.
    Map<String, TrackingType> trackingTypeMap = exerciseRepository.findAllById(exerciseIds)
        .stream()
        .collect(Collectors.toMap(
            ex -> ex.getId(),
            ex -> Objects.requireNonNullElse(ex.getTrackingType(), TrackingType.WEIGHT_REPS)
        ));

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

      TrackingType trackingType = trackingTypeMap.getOrDefault(exerciseId, TrackingType.WEIGHT_REPS);

      // Phase 1 — reduce all sets to a single session record
      SessionRecord session = buildSessionRecord(sets, trackingType);
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
      evaluateSession(progress, session, trackingType, workoutId, workoutFinishedAt, newEvents);
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
   * Only reads the fields that are relevant for the given tracking type.
   */
  private SessionRecord buildSessionRecord(List<WorkoutSet> sets, TrackingType trackingType) {
    double sessionMaxWeight = 0;
    double sessionBestRepWeight = 0;
    int sessionBestRepReps = 0;
    double sessionBestE1rm = 0;
    double sessionBestE1rmWeight = 0;
    int sessionBestE1rmReps = 0;
    int sessionLongestDuration = 0;
    double sessionLongestDistance = 0;

    for (WorkoutSet set : sets) {
      switch (trackingType) {
        case WEIGHT_REPS -> {
          Integer reps = set.getReps();
          Double weight = set.getWeight();
          if (reps == null || reps <= 0 || weight == null || weight < 0) continue;

          double e1rm = calculateEpley(weight, reps);

          if (weight > sessionMaxWeight) sessionMaxWeight = weight;

          if (reps > sessionBestRepReps
              || (reps == sessionBestRepReps && weight > sessionBestRepWeight)) {
            sessionBestRepReps = reps;
            sessionBestRepWeight = weight;
          }

          if (e1rm > sessionBestE1rm) {
            sessionBestE1rm = e1rm;
            sessionBestE1rmWeight = weight;
            sessionBestE1rmReps = reps;
          }
        }
        case REPS_ONLY -> {
          Integer reps = set.getReps();
          Double weight = set.getWeight();
          if (reps == null || reps <= 0) continue;

          double effectiveWeight = weight != null ? weight : 0.0;

          if (reps > sessionBestRepReps
              || (reps == sessionBestRepReps && effectiveWeight > sessionBestRepWeight)) {
            sessionBestRepReps = reps;
            sessionBestRepWeight = effectiveWeight;
          }
        }
        case DURATION, CARDIO -> {
          Integer duration = set.getDurationSeconds();
          if (duration == null || duration <= 0) continue;

          if (duration > sessionLongestDuration) sessionLongestDuration = duration;

          if (trackingType == TrackingType.CARDIO) {
            Double distance = set.getDistanceKm();
            if (distance != null && distance > sessionLongestDistance) {
              sessionLongestDistance = distance;
            }
          }
        }
      }
    }

    return new SessionRecord(
        sessionMaxWeight,
        sessionBestRepWeight,
        sessionBestRepReps,
        sessionBestE1rm,
        sessionBestE1rmWeight,
        sessionBestE1rmReps,
        sessionLongestDuration,
        sessionLongestDistance
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
      TrackingType trackingType,
      String workoutId,
      Instant achievedAt,
      List<PrEvent> newEvents
  ) {
    switch (trackingType) {
      case WEIGHT_REPS -> {
        evaluateWeightPr(progress, session, workoutId, achievedAt, newEvents);
        evaluateRepPr(progress, session, workoutId, achievedAt, newEvents);
        evaluateE1rmPr(progress, session, workoutId, achievedAt, newEvents);
      }
      case REPS_ONLY -> {
        evaluateRepPr(progress, session, workoutId, achievedAt, newEvents);
      }
      case DURATION -> {
        evaluateDurationPr(progress, session, workoutId, achievedAt, newEvents);
      }
      case CARDIO -> {
        evaluateDurationPr(progress, session, workoutId, achievedAt, newEvents);
        evaluateDistancePr(progress, session, workoutId, achievedAt, newEvents);
      }
    }
  }

  // ── PR evaluators ─────────────────────────────────────────────────────

  private void evaluateWeightPr(
      ExerciseProgress progress,
      SessionRecord session,
      String workoutId,
      Instant achievedAt,
      List<PrEvent> newEvents
  ) {
    if (session.maxWeight() <= progress.getWeightPr()) return;

    Double previous = progress.getWeightPr() > 0 ? progress.getWeightPr() : null;
    if (progress.getFirstWeightPr() == null) {
      progress.setFirstWeightPr(previous != null ? previous : session.maxWeight());
    }

    progress.setWeightPr(session.maxWeight());
    progress.setLastImprovedAt(achievedAt);
    progress.setTotalPrs(progress.getTotalPrs() + 1);
    newEvents.add(prEvent(progress, PrType.WEIGHT,
        previous, session.maxWeight(), null, null, workoutId, achievedAt));
  }

  private void evaluateRepPr(
      ExerciseProgress progress,
      SessionRecord session,
      String workoutId,
      Instant achievedAt,
      List<PrEvent> newEvents
  ) {
    boolean repPr = session.bestRepReps() > progress.getRepPrReps()
        || (session.bestRepReps() == progress.getRepPrReps()
            && session.bestRepReps() > 0
            && session.bestRepWeight() > progress.getRepPrWeight());

    if (!repPr) return;

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

  private void evaluateE1rmPr(
      ExerciseProgress progress,
      SessionRecord session,
      String workoutId,
      Instant achievedAt,
      List<PrEvent> newEvents
  ) {
    if (session.bestE1rm() <= progress.getEstimatedOneRepMaxPr()) return;

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

  private void evaluateDurationPr(
      ExerciseProgress progress,
      SessionRecord session,
      String workoutId,
      Instant achievedAt,
      List<PrEvent> newEvents
  ) {
    if (session.longestDuration() <= progress.getLongestDurationSeconds()) return;

    Double previous = progress.getLongestDurationSeconds() > 0
        ? (double) progress.getLongestDurationSeconds()
        : null;

    progress.setLongestDurationSeconds(session.longestDuration());
    progress.setLastImprovedAt(achievedAt);
    progress.setTotalPrs(progress.getTotalPrs() + 1);
    newEvents.add(prEvent(progress, PrType.DURATION,
        previous, (double) session.longestDuration(), null, null, workoutId, achievedAt));
  }

  private void evaluateDistancePr(
      ExerciseProgress progress,
      SessionRecord session,
      String workoutId,
      Instant achievedAt,
      List<PrEvent> newEvents
  ) {
    if (session.longestDistance() <= progress.getLongestDistanceKm()) return;

    Double previous = progress.getLongestDistanceKm() > 0
        ? progress.getLongestDistanceKm()
        : null;

    progress.setLongestDistanceKm(session.longestDistance());
    progress.setLastImprovedAt(achievedAt);
    progress.setTotalPrs(progress.getTotalPrs() + 1);
    newEvents.add(prEvent(progress, PrType.DISTANCE,
        previous, session.longestDistance(), null, null, workoutId, achievedAt));
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
        // Strength fields — null when not applicable
        .bestWeight(session.maxWeight() > 0 ? session.maxWeight() : null)
        .bestSetWeight(session.bestE1rmWeight() > 0 ? session.bestE1rmWeight() : null)
        .bestSetReps(session.bestE1rmReps())
        .estimatedOneRepMax(roundToTwo(session.bestE1rm()))
        // Duration / cardio fields — null when not applicable
        .bestDurationSeconds(session.longestDuration() > 0 ? session.longestDuration() : null)
        .bestDistanceKm(session.longestDistance() > 0 ? session.longestDistance() : null)
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
   *
   * <p>Fields that are not applicable to a tracking type will hold their
   * zero values and are never used in evaluation for that type.
   */
  private record SessionRecord(
      double maxWeight,
      double bestRepWeight,
      int bestRepReps,
      double bestE1rm,
      double bestE1rmWeight,
      int bestE1rmReps,
      int longestDuration,
      double longestDistance
  ) {
    /** True if at least one valid set was recorded this session. */
    boolean hasValidSets() {
      return maxWeight > 0
          || bestRepReps > 0
          || longestDuration > 0
          || longestDistance > 0;
    }
  }
}
