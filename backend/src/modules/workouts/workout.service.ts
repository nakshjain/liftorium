import { AppError } from "../../shared/errors/app-error.js";
import { exerciseRepository } from "../exercises/exercise.repository.js";
import type { WorkoutDocument, WorkoutExerciseDocument, WorkoutSetDocument } from "./workout.model.js";
import { workoutRepository, type WorkoutEntity } from "./workout.repository.js";
import type {
  AddWorkoutExerciseDto,
  AddWorkoutSetDto,
  FinishWorkoutDto,
  ListWorkoutHistoryQueryDto,
  PaginatedWorkoutsDto,
  StartWorkoutDto,
  WorkoutDto,
  WorkoutExerciseDto,
  WorkoutSetDto
} from "./workout.types.js";

export class WorkoutService {
  public async start(userId: string, input: StartWorkoutDto): Promise<WorkoutDto> {
    const activeWorkout = await workoutRepository.findActiveForUser(userId);

    if (activeWorkout) {
      throw new AppError("ACTIVE_WORKOUT_EXISTS", "An active workout session already exists", 409);
    }

    const workout = await workoutRepository.create(userId, input);
    return this.toDto(workout);
  }

  public async getActive(userId: string): Promise<WorkoutDto | null> {
    const workout = await workoutRepository.findActiveForUser(userId);
    return workout ? this.toDto(workout) : null;
  }

  public async getById(userId: string, workoutId: string): Promise<WorkoutDto> {
    const workout = await workoutRepository.findByIdForUser(workoutId, userId);

    if (!workout) {
      throw new AppError("WORKOUT_NOT_FOUND", "Workout was not found", 404);
    }

    return this.toDto(workout);
  }

  public async listHistory(userId: string, query: ListWorkoutHistoryQueryDto): Promise<PaginatedWorkoutsDto> {
    const result = await workoutRepository.listHistoryForUser(userId, query);

    return {
      items: result.items.map((workout) => this.toDto(workout)),
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / query.limit)
    };
  }

  public async addExercise(userId: string, workoutId: string, input: AddWorkoutExerciseDto): Promise<WorkoutDto> {
    const exercise = await exerciseRepository.findById(input.exerciseId);

    if (!exercise) {
      throw new AppError("EXERCISE_NOT_FOUND", "Exercise was not found", 404);
    }

    const existingWorkout = await workoutRepository.findByIdForUser(workoutId, userId);

    if (!existingWorkout) {
      throw new AppError("WORKOUT_NOT_FOUND", "Workout was not found", 404);
    }

    this.ensureActive(existingWorkout);

    const workout = await workoutRepository.addExercise(workoutId, userId, input);

    if (!workout) {
      throw new AppError("WORKOUT_NOT_FOUND", "Workout was not found", 404);
    }

    return this.toDto(workout);
  }

  public async addSet(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    input: AddWorkoutSetDto
  ): Promise<WorkoutDto> {
    const existingWorkout = await workoutRepository.findByIdForUser(workoutId, userId);

    if (!existingWorkout) {
      throw new AppError("WORKOUT_NOT_FOUND", "Workout was not found", 404);
    }

    this.ensureActive(existingWorkout);
    this.ensureWorkoutExerciseExists(existingWorkout, workoutExerciseId);

    const workout = await workoutRepository.addSet(workoutId, userId, workoutExerciseId, input);

    if (!workout) {
      throw new AppError("WORKOUT_NOT_FOUND", "Workout was not found", 404);
    }

    return this.toDto(workout);
  }

  public async removeSet(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    setId: string
  ): Promise<WorkoutDto> {
    const existingWorkout = await workoutRepository.findByIdForUser(workoutId, userId);

    if (!existingWorkout) {
      throw new AppError("WORKOUT_NOT_FOUND", "Workout was not found", 404);
    }

    this.ensureActive(existingWorkout);
    this.ensureWorkoutExerciseExists(existingWorkout, workoutExerciseId);
    this.ensureSetExists(existingWorkout, workoutExerciseId, setId);

    const workout = await workoutRepository.removeSet(workoutId, userId, workoutExerciseId, setId);

    if (!workout) {
      throw new AppError("WORKOUT_NOT_FOUND", "Workout was not found", 404);
    }

    return this.toDto(workout);
  }

  public async finish(userId: string, workoutId: string, input: FinishWorkoutDto): Promise<WorkoutDto> {
    const existingWorkout = await workoutRepository.findByIdForUser(workoutId, userId);

    if (!existingWorkout) {
      throw new AppError("WORKOUT_NOT_FOUND", "Workout was not found", 404);
    }

    this.ensureActive(existingWorkout);

    const workout = await workoutRepository.finish(workoutId, userId, input);

    if (!workout) {
      throw new AppError("WORKOUT_NOT_FOUND", "Workout was not found", 404);
    }

    return this.toDto(workout);
  }

  private ensureActive(workout: WorkoutDocument): void {
    if (workout.status !== "active") {
      throw new AppError("WORKOUT_NOT_ACTIVE", "Workout is not active", 409);
    }
  }

  private ensureWorkoutExerciseExists(workout: WorkoutDocument, workoutExerciseId: string): void {
    const workoutExercise = workout.exercises.find((exercise) => exercise._id.toString() === workoutExerciseId);

    if (!workoutExercise) {
      throw new AppError("WORKOUT_EXERCISE_NOT_FOUND", "Workout exercise was not found", 404);
    }
  }

  private ensureSetExists(workout: WorkoutDocument, workoutExerciseId: string, setId: string): void {
    const workoutExercise = workout.exercises.find((exercise) => exercise._id.toString() === workoutExerciseId);
    const workoutSet = workoutExercise?.sets.find((set) => set._id.toString() === setId);

    if (!workoutSet) {
      throw new AppError("WORKOUT_SET_NOT_FOUND", "Workout set was not found", 404);
    }
  }

  private toDto(workout: WorkoutEntity): WorkoutDto {
    return {
      id: workout._id.toString(),
      userId: workout.userId.toString(),
      name: workout.name,
      status: workout.status,
      startedAt: workout.startedAt.toISOString(),
      finishedAt: workout.finishedAt?.toISOString(),
      durationSeconds: workout.durationSeconds,
      notes: workout.notes,
      exercises: workout.exercises.map((exercise) => this.toExerciseDto(exercise)),
      createdAt: workout.createdAt.toISOString(),
      updatedAt: workout.updatedAt.toISOString()
    };
  }

  private toExerciseDto(exercise: WorkoutExerciseDocument): WorkoutExerciseDto {
    return {
      id: exercise._id.toString(),
      exerciseId: exercise.exerciseId.toString(),
      order: exercise.order,
      supersetGroupId: exercise.supersetGroupId,
      notes: exercise.notes,
      sets: exercise.sets.map((set) => this.toSetDto(set))
    };
  }

  private toSetDto(set: WorkoutSetDocument): WorkoutSetDto {
    return {
      id: set._id.toString(),
      order: set.order,
      reps: set.reps,
      weight: set.weight,
      restTimeSeconds: set.restTimeSeconds,
      durationSeconds: set.durationSeconds,
      rpe: set.rpe,
      isWarmup: set.isWarmup,
      setType: set.setType,
      tempo: set.tempo,
      notes: set.notes,
      completedAt: set.completedAt?.toISOString()
    };
  }
}

export const workoutService = new WorkoutService();
