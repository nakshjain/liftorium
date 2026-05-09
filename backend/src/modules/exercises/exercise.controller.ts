import type { Request, Response } from "express";
import { exerciseService } from "./exercise.service.js";
import type { ExerciseIdParam, ListExercisesRequestQuery } from "./exercise.validation.js";
import type { CreateExerciseDto, UpdateExerciseDto } from "./exercise.types.js";

export class ExerciseController {
  public async create(request: Request, response: Response) {
    const body = request.body as CreateExerciseDto;
    const exercise = await exerciseService.create(body);

    response.status(201).json({
      success: true,
      data: {
        exercise
      }
    });
  }

  public async getById(request: Request, response: Response) {
    const params = request.params as ExerciseIdParam;
    const exercise = await exerciseService.getById(params.exerciseId);

    response.status(200).json({
      success: true,
      data: {
        exercise
      }
    });
  }

  public async list(request: Request, response: Response) {
    const query = request.query as unknown as ListExercisesRequestQuery;
    const result = await exerciseService.list(query);

    response.status(200).json({
      success: true,
      data: result
    });
  }

  public async update(request: Request, response: Response) {
    const params = request.params as ExerciseIdParam;
    const body = request.body as UpdateExerciseDto;
    const exercise = await exerciseService.update(params.exerciseId, body);

    response.status(200).json({
      success: true,
      data: {
        exercise
      }
    });
  }

  public async delete(request: Request, response: Response) {
    const params = request.params as ExerciseIdParam;
    await exerciseService.delete(params.exerciseId);

    response.status(200).json({
      success: true,
      data: {
        deleted: true
      }
    });
  }
}

export const exerciseController = new ExerciseController();
