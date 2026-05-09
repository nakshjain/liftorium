import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Value must be a valid MongoDB ObjectId");
const optionalNotesSchema = z.string().trim().min(1).max(2000).optional();

const tempoSchema = z.object({
  eccentric: z.number().int().min(0).max(20).optional(),
  pauseBottom: z.number().int().min(0).max(20).optional(),
  concentric: z.number().int().min(0).max(20).optional(),
  pauseTop: z.number().int().min(0).max(20).optional()
});

export const workoutIdParamSchema = z.object({
  workoutId: objectIdSchema
});

export const workoutExerciseIdParamSchema = workoutIdParamSchema.extend({
  workoutExerciseId: objectIdSchema
});

export const workoutSetIdParamSchema = workoutExerciseIdParamSchema.extend({
  setId: objectIdSchema
});

export const startWorkoutSchema = z.object({
  name: z.string().trim().min(1).max(120),
  startedAt: z.string().datetime().optional(),
  notes: optionalNotesSchema
});

export const addWorkoutExerciseSchema = z.object({
  exerciseId: objectIdSchema,
  supersetGroupId: z.string().trim().min(1).max(80).optional(),
  notes: optionalNotesSchema
});

export const addWorkoutSetSchema = z.object({
  reps: z.number().int().min(0).max(1000),
  weight: z.number().min(0).max(2000),
  restTimeSeconds: z.number().int().min(0).max(7200).optional(),
  durationSeconds: z.number().int().min(0).max(7200).optional(),
  rpe: z.number().min(1).max(10).optional(),
  isWarmup: z.boolean().optional(),
  setType: z.enum(["standard", "warmup", "dropset"]).optional(),
  tempo: tempoSchema.optional(),
  notes: optionalNotesSchema,
  completedAt: z.string().datetime().optional()
});

export const finishWorkoutSchema = z.object({
  finishedAt: z.string().datetime().optional(),
  durationSeconds: z.number().int().min(0).max(86400).optional(),
  notes: optionalNotesSchema
});

export const listWorkoutHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type WorkoutIdParam = z.infer<typeof workoutIdParamSchema>;
export type WorkoutExerciseIdParam = z.infer<typeof workoutExerciseIdParamSchema>;
export type WorkoutSetIdParam = z.infer<typeof workoutSetIdParamSchema>;
export type StartWorkoutRequestBody = z.infer<typeof startWorkoutSchema>;
export type AddWorkoutExerciseRequestBody = z.infer<typeof addWorkoutExerciseSchema>;
export type AddWorkoutSetRequestBody = z.infer<typeof addWorkoutSetSchema>;
export type FinishWorkoutRequestBody = z.infer<typeof finishWorkoutSchema>;
export type ListWorkoutHistoryRequestQuery = z.infer<typeof listWorkoutHistoryQuerySchema>;
