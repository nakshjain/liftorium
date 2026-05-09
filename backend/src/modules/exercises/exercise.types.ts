export type ExerciseDto = {
  id: string;
  name: string;
  description: string;
  category: string;
  equipment: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  tips: string[];
  mediaUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateExerciseDto = {
  name: string;
  description: string;
  category: string;
  equipment: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  tips: string[];
  mediaUrl?: string;
};

export type UpdateExerciseDto = Partial<CreateExerciseDto>;

export type ListExercisesQueryDto = {
  page: number;
  limit: number;
  search?: string;
  muscleGroup?: string;
  equipment?: string;
  category?: string;
};

export type PaginatedExercisesDto = {
  items: ExerciseDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
