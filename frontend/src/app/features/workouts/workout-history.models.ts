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

export type PersonalRecord = {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  achievedAt: string;
};

export type WorkoutStats = {
  sessions: number;
  totalVolume: number;
  totalSets: number;
  streak: number;
  previousMonthVolume: number;
  personalRecords: PersonalRecord[];
};
