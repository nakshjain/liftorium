export type WorkoutStatus = "active" | "completed" | "discarded";

export type WorkoutSetType = "standard" | "warmup" | "dropset";

export type TempoDto = {
  eccentric?: number;
  pauseBottom?: number;
  concentric?: number;
  pauseTop?: number;
};

export type WorkoutSetDto = {
  id: string;
  order: number;
  reps: number;
  weight: number;
  restTimeSeconds?: number;
  durationSeconds?: number;
  rpe?: number;
  isWarmup: boolean;
  setType: WorkoutSetType;
  tempo?: TempoDto;
  notes?: string;
  completedAt?: string;
};

export type WorkoutExerciseDto = {
  id: string;
  exerciseId: string;
  order: number;
  supersetGroupId?: string;
  notes?: string;
  sets: WorkoutSetDto[];
};

export type WorkoutDto = {
  id: string;
  userId: string;
  name: string;
  status: WorkoutStatus;
  startedAt: string;
  finishedAt?: string;
  durationSeconds?: number;
  notes?: string;
  exercises: WorkoutExerciseDto[];
  createdAt: string;
  updatedAt: string;
};

export type StartWorkoutDto = {
  name: string;
  startedAt?: string;
  notes?: string;
};

export type AddWorkoutExerciseDto = {
  exerciseId: string;
  supersetGroupId?: string;
  notes?: string;
};

export type AddWorkoutSetDto = {
  reps: number;
  weight: number;
  restTimeSeconds?: number;
  durationSeconds?: number;
  rpe?: number;
  isWarmup?: boolean;
  setType?: WorkoutSetType;
  tempo?: TempoDto;
  notes?: string;
  completedAt?: string;
};

export type FinishWorkoutDto = {
  finishedAt?: string;
  durationSeconds?: number;
  notes?: string;
};

export type ListWorkoutHistoryQueryDto = {
  page: number;
  limit: number;
};

export type PaginatedWorkoutsDto = {
  items: WorkoutDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
