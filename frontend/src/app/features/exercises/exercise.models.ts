export type ExerciseType =
  | 'STRENGTH'
  | 'CARDIO'
  | 'STRETCHING'
  | 'MOBILITY'
  | 'BALANCE'
  | 'PLYOMETRICS'
  | 'REHABILITATION'
  | 'OTHER';

/**
 * Determines which fields are captured per set and which PR analytics apply.
 * Mirrors the backend {@code TrackingType} enum.
 */
export type TrackingType =
  | 'WEIGHT_REPS'
  | 'REPS_ONLY'
  | 'DURATION'
  | 'CARDIO';

export type ExerciseContent = {
  overview: string | null;
  instructions: string[];
};

export type Exercise = {
  id: string;
  name: string;
  slug: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  exerciseType: ExerciseType;
  trackingType: TrackingType;
  level: string | null;
  mechanic: string | null;
  active: boolean;
  content: ExerciseContent | null;
  createdAt: string;
  updatedAt: string;
};

export type ExercisePage = {
  items: Exercise[];
  nextCursor: string | null;
  hasNext: boolean;
};

export type ListExercisesParams = {
  limit?: number;
  cursor?: string;
  muscle?: string;
  equipment?: string;
  exerciseType?: ExerciseType;
  level?: string;
  mechanic?: string;
  force?: string;
};

export type SearchExercisesParams = {
  q: string;
  limit?: number;
  muscle?: string;
  equipment?: string;
};
