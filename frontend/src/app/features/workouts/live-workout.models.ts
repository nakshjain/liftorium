import type { TrackingType } from '../exercises/exercise.models';

export type { TrackingType };

export type WorkoutSet = {
  id: string;
  order: number;

  // ── Strength ────────────────────────────────────────────────────────────
  /** Required for WEIGHT_REPS; required for REPS_ONLY. */
  reps: number | null;
  /** Required for WEIGHT_REPS; optional for REPS_ONLY. */
  weight: number | null;

  // ── Duration / Cardio ───────────────────────────────────────────────────
  /** Required for DURATION and CARDIO. Seconds. */
  durationSeconds: number | null;

  // ── Cardio optional ─────────────────────────────────────────────────────
  distanceKm: number | null;
  speed: number | null;
  incline: number | null;

  // ── Audit ────────────────────────────────────────────────────────────────
  completed: boolean;
  completedAt: string | null;
};

export type ExerciseOption = {
  id: string;
  name: string;
  target: string;
  equipment: string;
  trackingType: TrackingType;
  previous: PreviousSet[];
  /** Best single set (heaviest weight × reps) across all history. */
  bestSet?: PreviousSet | null;
};

export type PreviousSet = {
  reps: number | null;
  weight: number | null;
  durationSeconds?: number | null;
  distanceKm?: number | null;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  name: string;
  target: string;
  equipment: string;
  trackingType: TrackingType;
  previous: PreviousSet[];
  /** Best single set across all historical sessions for this exercise. */
  bestSet: PreviousSet | null;
  sets: WorkoutSet[];
};

export type LiveWorkout = {
  id: string;
  name: string;
  startedAt: number;
  finishedAt: number | null;
  resumedAt: number;
  accumulatedMs: number;
  exercises: WorkoutExercise[];
};
