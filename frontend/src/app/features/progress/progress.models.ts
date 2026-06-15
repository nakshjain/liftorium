export type ProgressOverview = {
  totalPrs: number;
  exercisesImproved: number;
  latestPrDate: string | null;
  strongestExercise: StrongestExercise | null;
};

export type StrongestExercise = {
  exerciseId: string;
  exerciseName: string;
  weightPr: number;
};

export type RepPr = {
  weight: number;
  reps: number;
};

export type ExerciseProgressSummary = {
  exerciseId: string;
  exerciseName: string;
  weightPr: number;
  repPr: RepPr;
  estimatedOneRepMaxPr: number;
  totalPrs: number;
  lastImprovedAt: string | null;
};

export type PaginatedExerciseProgress = {
  items: ExerciseProgressSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ExerciseProgressDetail = {
  exerciseId: string;
  exerciseName: string;
  firstWeightPr: number | null;
  weightPr: number;
  repPr: RepPr;
  firstEstimatedOneRepMax: number | null;
  estimatedOneRepMaxPr: number;
  totalPrs: number;
  lastImprovedAt: string | null;
};

export type PrType = 'WEIGHT' | 'REPS' | 'ESTIMATED_ONE_REP_MAX';

export type PrEvent = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  prType: PrType;
  /** Previous record value before this PR. Null = first ever PR of this type. */
  previousValue: number | null;
  /** New record value set by this PR event. */
  newValue: number | null;
  /**
   * For REPS PRs: weight at which the previous rep PR was achieved.
   * Null for non-REPS events and when there was no prior rep PR.
   */
  prevRepWeight: number | null;
  /**
   * For REPS PRs: weight at which the new rep PR was achieved.
   * Null for non-REPS events.
   */
  newRepWeight: number | null;
  workoutId: string;
  achievedAt: string;
};

export type PaginatedPrEvents = {
  items: PrEvent[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ExerciseProgressHistoryEntry = {
  id: string;
  workoutId: string;
  bestWeight: number;
  bestSetWeight: number;
  bestSetReps: number;
  estimatedOneRepMax: number;
  performedAt: string;
};

export type ExerciseProgressHistory = {
  exerciseId: string;
  exerciseName: string;
  entries: ExerciseProgressHistoryEntry[];
};

export type ListExerciseProgressParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type ListPrEventsParams = {
  page?: number;
  limit?: number;
  prType?: PrType | null;
  exerciseId?: string;
};
