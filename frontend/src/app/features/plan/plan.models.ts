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
  id: string;
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

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    shortName: 'PPL',
    description: '6 days — high frequency, great for intermediate lifters',
    days: [
      { dayOfWeek: 0, label: 'Push', muscleGroups: ['Chest', 'Shoulders', 'Triceps'], exercises: [], rest: false },
      { dayOfWeek: 1, label: 'Pull', muscleGroups: ['Back', 'Biceps', 'Forearms'], exercises: [], rest: false },
      { dayOfWeek: 2, label: 'Legs', muscleGroups: ['Legs'], exercises: [], rest: false },
      { dayOfWeek: 3, label: 'Push', muscleGroups: ['Chest', 'Shoulders', 'Triceps'], exercises: [], rest: false },
      { dayOfWeek: 4, label: 'Pull', muscleGroups: ['Back', 'Biceps', 'Forearms'], exercises: [], rest: false },
      { dayOfWeek: 5, label: 'Legs', muscleGroups: ['Legs'], exercises: [], rest: false },
      { dayOfWeek: 6, label: 'Rest', muscleGroups: [], exercises: [], rest: true },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    shortName: 'U/L',
    description: '4 days — balanced volume, good for all levels',
    days: [
      { dayOfWeek: 0, label: 'Upper', muscleGroups: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'], exercises: [], rest: false },
      { dayOfWeek: 1, label: 'Lower', muscleGroups: ['Legs', 'Cardio'], exercises: [], rest: false },
      { dayOfWeek: 2, label: 'Rest', muscleGroups: [], exercises: [], rest: true },
      { dayOfWeek: 3, label: 'Upper', muscleGroups: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'], exercises: [], rest: false },
      { dayOfWeek: 4, label: 'Lower', muscleGroups: ['Legs', 'Cardio'], exercises: [], rest: false },
      { dayOfWeek: 5, label: 'Rest', muscleGroups: [], exercises: [], rest: true },
      { dayOfWeek: 6, label: 'Rest', muscleGroups: [], exercises: [], rest: true },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body',
    shortName: 'Full',
    description: '3 days — efficient, ideal for beginners',
    days: [
      { dayOfWeek: 0, label: 'Full Body', muscleGroups: ['Chest', 'Back', 'Legs', 'Shoulders'], exercises: [], rest: false },
      { dayOfWeek: 1, label: 'Rest', muscleGroups: [], exercises: [], rest: true },
      { dayOfWeek: 2, label: 'Full Body', muscleGroups: ['Chest', 'Back', 'Legs', 'Biceps'], exercises: [], rest: false },
      { dayOfWeek: 3, label: 'Rest', muscleGroups: [], exercises: [], rest: true },
      { dayOfWeek: 4, label: 'Full Body', muscleGroups: ['Chest', 'Back', 'Legs', 'Triceps'], exercises: [], rest: false },
      { dayOfWeek: 5, label: 'Rest', muscleGroups: [], exercises: [], rest: true },
      { dayOfWeek: 6, label: 'Rest', muscleGroups: [], exercises: [], rest: true },
    ],
  },
  {
    id: 'bro-split',
    name: 'Bro Split',
    shortName: 'Bro',
    description: '5 days — one muscle group per day, classic bodybuilding',
    days: [
      { dayOfWeek: 0, label: 'Chest', muscleGroups: ['Chest'], exercises: [], rest: false },
      { dayOfWeek: 1, label: 'Back', muscleGroups: ['Back'], exercises: [], rest: false },
      { dayOfWeek: 2, label: 'Shoulders', muscleGroups: ['Shoulders'], exercises: [], rest: false },
      { dayOfWeek: 3, label: 'Arms', muscleGroups: ['Biceps', 'Triceps', 'Forearms'], exercises: [], rest: false },
      { dayOfWeek: 4, label: 'Legs', muscleGroups: ['Legs'], exercises: [], rest: false },
      { dayOfWeek: 5, label: 'Rest', muscleGroups: [], exercises: [], rest: true },
      { dayOfWeek: 6, label: 'Rest', muscleGroups: [], exercises: [], rest: true },
    ],
  },
];

export function emptyPlan(): WorkoutPlan {
  return {
    id: crypto.randomUUID(),
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
