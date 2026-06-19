export type WorkoutSetDto = {
  id: string;
  order: number;
  reps: number;
  weight: number;
  completedAt: string | null;
};

export type WorkoutExerciseDto = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  order: number;
  sets: WorkoutSetDto[];
};

export type WorkoutDto = {
  id: string;
  userId: string;
  name: string;
  status: 'active' | 'completed';
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  notes: string | null;
  exercises: WorkoutExerciseDto[];
  createdAt: string;
  updatedAt: string;
};

export type PaginatedWorkouts = {
  items: WorkoutDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Activity-only stats — no PR data. PRs live exclusively in /progress. */
export type WorkoutStats = {
  sessions: number;
  totalVolume: number;
  totalSets: number;
  streak: number;
  previousMonthVolume: number;
};

/** Most-trained exercise by number of distinct workout sessions. */
export type MostTrainedExercise = {
  exerciseId: string;
  exerciseName: string;
  sessionCount: number;
};

/** Lightweight activity insights returned by GET /history/insights. */
export type HistoryInsights = {
  mostTrainedExercise: MostTrainedExercise | null;
};
