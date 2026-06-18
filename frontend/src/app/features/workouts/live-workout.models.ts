export type WorkoutSet = {
  id: string;
  order: number;
  reps: number;
  weight: number;
  completed: boolean;
  completedAt: string | null;
};

export type ExerciseOption = {
  id: string;
  name: string;
  target: string;
  equipment: string;
  previous: PreviousSet[];
  /** Best single set (heaviest weight × reps) across all history. */
  bestSet?: PreviousSet | null;
};

export type PreviousSet = {
  reps: number;
  weight: number;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  name: string;
  target: string;
  equipment: string;
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
