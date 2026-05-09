import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { exerciseController } from "./exercise.controller.js";
import {
  createExerciseSchema,
  exerciseIdParamSchema,
  listExercisesQuerySchema,
  updateExerciseSchema
} from "./exercise.validation.js";

export const exerciseRoutes = Router();

exerciseRoutes.get("/", validateQuery(listExercisesQuerySchema), asyncHandler(exerciseController.list.bind(exerciseController)));
exerciseRoutes.post(
  "/",
  authMiddleware,
  validateBody(createExerciseSchema),
  asyncHandler(exerciseController.create.bind(exerciseController))
);
exerciseRoutes.get(
  "/:exerciseId",
  validateParams(exerciseIdParamSchema),
  asyncHandler(exerciseController.getById.bind(exerciseController))
);
exerciseRoutes.patch(
  "/:exerciseId",
  authMiddleware,
  validateParams(exerciseIdParamSchema),
  validateBody(updateExerciseSchema),
  asyncHandler(exerciseController.update.bind(exerciseController))
);
exerciseRoutes.delete(
  "/:exerciseId",
  authMiddleware,
  validateParams(exerciseIdParamSchema),
  asyncHandler(exerciseController.delete.bind(exerciseController))
);
