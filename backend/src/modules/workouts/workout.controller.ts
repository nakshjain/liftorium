import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../../middleware/auth.middleware.js";
import { workoutService } from "./workout.service.js";
import type {
  AddWorkoutExerciseDto,
  AddWorkoutSetDto,
  FinishWorkoutDto,
  StartWorkoutDto
} from "./workout.types.js";
import type {
  ListWorkoutHistoryRequestQuery,
  WorkoutExerciseIdParam,
  WorkoutIdParam,
  WorkoutSetIdParam
} from "./workout.validation.js";

type RequestWithUser = Request & {
  user: AuthenticatedUser;
};

export class WorkoutController {
  public async start(request: Request, response: Response) {
    const authRequest = request as RequestWithUser;
    const body = request.body as StartWorkoutDto;
    const workout = await workoutService.start(authRequest.user.id, body);

    response.status(201).json({
      success: true,
      data: {
        workout
      }
    });
  }

  public async getActive(request: Request, response: Response) {
    const authRequest = request as RequestWithUser;
    const workout = await workoutService.getActive(authRequest.user.id);

    response.status(200).json({
      success: true,
      data: {
        workout
      }
    });
  }

  public async getById(request: Request, response: Response) {
    const authRequest = request as RequestWithUser;
    const params = request.params as WorkoutIdParam;
    const workout = await workoutService.getById(authRequest.user.id, params.workoutId);

    response.status(200).json({
      success: true,
      data: {
        workout
      }
    });
  }

  public async listHistory(request: Request, response: Response) {
    const authRequest = request as RequestWithUser;
    const query = request.query as unknown as ListWorkoutHistoryRequestQuery;
    const result = await workoutService.listHistory(authRequest.user.id, query);

    response.status(200).json({
      success: true,
      data: result
    });
  }

  public async addExercise(request: Request, response: Response) {
    const authRequest = request as RequestWithUser;
    const params = request.params as WorkoutIdParam;
    const body = request.body as AddWorkoutExerciseDto;
    const workout = await workoutService.addExercise(authRequest.user.id, params.workoutId, body);

    response.status(200).json({
      success: true,
      data: {
        workout
      }
    });
  }

  public async addSet(request: Request, response: Response) {
    const authRequest = request as RequestWithUser;
    const params = request.params as WorkoutExerciseIdParam;
    const body = request.body as AddWorkoutSetDto;
    const workout = await workoutService.addSet(
      authRequest.user.id,
      params.workoutId,
      params.workoutExerciseId,
      body
    );

    response.status(200).json({
      success: true,
      data: {
        workout
      }
    });
  }

  public async removeSet(request: Request, response: Response) {
    const authRequest = request as RequestWithUser;
    const params = request.params as WorkoutSetIdParam;
    const workout = await workoutService.removeSet(
      authRequest.user.id,
      params.workoutId,
      params.workoutExerciseId,
      params.setId
    );

    response.status(200).json({
      success: true,
      data: {
        workout
      }
    });
  }

  public async finish(request: Request, response: Response) {
    const authRequest = request as RequestWithUser;
    const params = request.params as WorkoutIdParam;
    const body = request.body as FinishWorkoutDto;
    const workout = await workoutService.finish(authRequest.user.id, params.workoutId, body);

    response.status(200).json({
      success: true,
      data: {
        workout
      }
    });
  }
}

export const workoutController = new WorkoutController();
