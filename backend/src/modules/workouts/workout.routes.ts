import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { workoutController } from "./workout.controller.js";
import {
  addWorkoutExerciseSchema,
  addWorkoutSetSchema,
  finishWorkoutSchema,
  listWorkoutHistoryQuerySchema,
  startWorkoutSchema,
  workoutExerciseIdParamSchema,
  workoutIdParamSchema,
  workoutSetIdParamSchema
} from "./workout.validation.js";

export const workoutRoutes = Router();

workoutRoutes.use(authMiddleware);

workoutRoutes.post("/", validateBody(startWorkoutSchema), asyncHandler(workoutController.start.bind(workoutController)));
workoutRoutes.get("/active", asyncHandler(workoutController.getActive.bind(workoutController)));
workoutRoutes.get(
  "/history",
  validateQuery(listWorkoutHistoryQuerySchema),
  asyncHandler(workoutController.listHistory.bind(workoutController))
);
workoutRoutes.get(
  "/:workoutId",
  validateParams(workoutIdParamSchema),
  asyncHandler(workoutController.getById.bind(workoutController))
);
workoutRoutes.post(
  "/:workoutId/exercises",
  validateParams(workoutIdParamSchema),
  validateBody(addWorkoutExerciseSchema),
  asyncHandler(workoutController.addExercise.bind(workoutController))
);
workoutRoutes.post(
  "/:workoutId/exercises/:workoutExerciseId/sets",
  validateParams(workoutExerciseIdParamSchema),
  validateBody(addWorkoutSetSchema),
  asyncHandler(workoutController.addSet.bind(workoutController))
);
workoutRoutes.delete(
  "/:workoutId/exercises/:workoutExerciseId/sets/:setId",
  validateParams(workoutSetIdParamSchema),
  asyncHandler(workoutController.removeSet.bind(workoutController))
);
workoutRoutes.post(
  "/:workoutId/finish",
  validateParams(workoutIdParamSchema),
  validateBody(finishWorkoutSchema),
  asyncHandler(workoutController.finish.bind(workoutController))
);
