import { z } from "zod";

const textField = z.string().trim().min(1).max(160);
const longTextField = z.string().trim().min(1).max(2000);
const stringList = z.array(z.string().trim().min(1).max(160)).min(1).max(20);
const optionalStringList = z.array(z.string().trim().min(1).max(160)).max(20).default([]);

export const exerciseIdParamSchema = z.object({
  exerciseId: z.string().regex(/^[a-f\d]{24}$/i, "exerciseId must be a valid MongoDB ObjectId")
});

export const createExerciseSchema = z.object({
  name: textField,
  description: longTextField,
  category: textField,
  equipment: textField,
  targetMuscles: stringList,
  secondaryMuscles: optionalStringList,
  instructions: stringList,
  tips: optionalStringList,
  mediaUrl: z.string().trim().url().max(2048).optional()
});

export const updateExerciseSchema = createExerciseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field must be provided"
  }
);

export const listExercisesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(120).optional(),
  muscleGroup: z.string().trim().min(1).max(120).optional(),
  equipment: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(1).max(120).optional()
});

export type ExerciseIdParam = z.infer<typeof exerciseIdParamSchema>;
export type CreateExerciseRequestBody = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseRequestBody = z.infer<typeof updateExerciseSchema>;
export type ListExercisesRequestQuery = z.infer<typeof listExercisesQuerySchema>;
