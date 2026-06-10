export type ExerciseType =
  | 'STRENGTH'
  | 'CARDIO'
  | 'STRETCHING'
  | 'MOBILITY'
  | 'BALANCE'
  | 'PLYOMETRICS'
  | 'REHABILITATION'
  | 'OTHER';

export type MovementPattern =
  | 'HORIZONTAL_PUSH'
  | 'HORIZONTAL_PULL'
  | 'VERTICAL_PUSH'
  | 'VERTICAL_PULL'
  | 'SQUAT'
  | 'HIP_HINGE'
  | 'LUNGE'
  | 'CARRY'
  | 'ROTATION'
  | 'CORE'
  | 'ISOLATION'
  | 'CARDIO'
  | 'OTHER';

export type ExerciseContent = {
  overview: string;
  instructions: string[];
  tips: string[];
};

export type Exercise = {
  id: string;
  name: string;
  slug: string;
  aliases: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  bodyParts: string[];
  equipment: string[];
  movementPattern: MovementPattern | null;
  exerciseType: ExerciseType;
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
  movementPattern?: MovementPattern;
};

export type SearchExercisesParams = {
  q: string;
  limit?: number;
  muscle?: string;
  equipment?: string;
};
