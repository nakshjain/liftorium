import { AppError } from "../../shared/errors/app-error.js";
import { exerciseRepository, type ExerciseEntity } from "./exercise.repository.js";
import type {
  CreateExerciseDto,
  ExerciseDto,
  ListExercisesQueryDto,
  PaginatedExercisesDto,
  UpdateExerciseDto
} from "./exercise.types.js";

export class ExerciseService {
  public async create(input: CreateExerciseDto): Promise<ExerciseDto> {
    const exercise = await exerciseRepository.create(input);
    return this.toDto(exercise);
  }

  public async getById(exerciseId: string): Promise<ExerciseDto> {
    const exercise = await exerciseRepository.findById(exerciseId);

    if (!exercise) {
      throw new AppError("EXERCISE_NOT_FOUND", "Exercise was not found", 404);
    }

    return this.toDto(exercise);
  }

  public async list(query: ListExercisesQueryDto): Promise<PaginatedExercisesDto> {
    const result = await exerciseRepository.list(query);

    return {
      items: result.items.map((exercise) => this.toDto(exercise)),
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / query.limit)
    };
  }

  public async update(exerciseId: string, input: UpdateExerciseDto): Promise<ExerciseDto> {
    const exercise = await exerciseRepository.updateById(exerciseId, input);

    if (!exercise) {
      throw new AppError("EXERCISE_NOT_FOUND", "Exercise was not found", 404);
    }

    return this.toDto(exercise);
  }

  public async delete(exerciseId: string): Promise<void> {
    const exercise = await exerciseRepository.deleteById(exerciseId);

    if (!exercise) {
      throw new AppError("EXERCISE_NOT_FOUND", "Exercise was not found", 404);
    }
  }

  private toDto(exercise: ExerciseEntity): ExerciseDto {
    return {
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      category: exercise.category,
      equipment: exercise.equipment,
      targetMuscles: exercise.targetMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      instructions: exercise.instructions,
      tips: exercise.tips,
      mediaUrl: exercise.mediaUrl,
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString()
    };
  }
}

export const exerciseService = new ExerciseService();
