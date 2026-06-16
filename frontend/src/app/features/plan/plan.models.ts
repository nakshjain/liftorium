export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Biceps'
  | 'Triceps'
  | 'Shoulders'
  | 'Legs'
  | 'Cardio'
  | 'Forearms';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Legs', 'Cardio',
];

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export type PlanSet = {
  reps: number;
};

export type PlanExercise = {
  exerciseId: string;
  exerciseName: string;
  sets: PlanSet[];
  order: number;
};

export type PlanDay = {
  dayOfWeek: number; // 0 = Mon, 6 = Sun
  label: string;
  muscleGroups: MuscleGroup[];
  exercises: PlanExercise[];
  rest: boolean;
};

export type WorkoutPlan = {
  id: string | null;
  templateId: string | null;
  name: string;
  days: PlanDay[];
};

export type PlanTemplate = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  days: Omit<PlanDay, never>[];
};

export function emptyPlan(): WorkoutPlan {
  return {
    id: null,
    templateId: null,
    name: 'My Plan',
    days: DAY_LABELS.map((_, i) => ({
      dayOfWeek: i,
      label: '',
      muscleGroups: [],
      exercises: [],
      rest: true,
    })),
  };
}
