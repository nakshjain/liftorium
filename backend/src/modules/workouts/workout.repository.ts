import { Types, type HydratedDocument } from "mongoose";
import { WorkoutModel, type WorkoutDocument } from "./workout.model.js";
import type {
  AddWorkoutExerciseDto,
  AddWorkoutSetDto,
  FinishWorkoutDto,
  ListWorkoutHistoryQueryDto,
  StartWorkoutDto
} from "./workout.types.js";

export type WorkoutEntity = HydratedDocument<WorkoutDocument>;

export class WorkoutRepository {
  public async create(userId: string, input: StartWorkoutDto) {
    return WorkoutModel.create({
      userId: new Types.ObjectId(userId),
      name: input.name,
      status: "active",
      startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
      notes: input.notes,
      exercises: []
    });
  }

  public async findByIdForUser(workoutId: string, userId: string) {
    return WorkoutModel.findOne({
      _id: workoutId,
      userId: new Types.ObjectId(userId)
    }).exec();
  }

  public async findActiveForUser(userId: string) {
    return WorkoutModel.findOne({
      userId: new Types.ObjectId(userId),
      status: "active"
    })
      .sort({ startedAt: -1 })
      .exec();
  }

  public async listHistoryForUser(userId: string, query: ListWorkoutHistoryQueryDto) {
    const filter = {
      userId: new Types.ObjectId(userId),
      status: "completed"
    };
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      WorkoutModel.find(filter).sort({ finishedAt: -1, startedAt: -1 }).skip(skip).limit(query.limit).exec(),
      WorkoutModel.countDocuments(filter).exec()
    ]);

    return {
      items,
      total
    };
  }

  public async addExercise(workoutId: string, userId: string, input: AddWorkoutExerciseDto) {
    const workout = await this.findByIdForUser(workoutId, userId);

    if (!workout) {
      return null;
    }

    workout.exercises.push({
      _id: new Types.ObjectId(),
      exerciseId: new Types.ObjectId(input.exerciseId),
      order: workout.exercises.length + 1,
      supersetGroupId: input.supersetGroupId,
      notes: input.notes,
      sets: []
    });

    await workout.save();
    return workout;
  }

  public async addSet(workoutId: string, userId: string, workoutExerciseId: string, input: AddWorkoutSetDto) {
    const workout = await this.findByIdForUser(workoutId, userId);

    if (!workout) {
      return null;
    }

    const workoutExercise = workout.exercises.find((exercise) => exercise._id.toString() === workoutExerciseId);

    if (!workoutExercise) {
      return workout;
    }

    workoutExercise.sets.push({
      _id: new Types.ObjectId(),
      order: workoutExercise.sets.length + 1,
      reps: input.reps,
      weight: input.weight,
      restTimeSeconds: input.restTimeSeconds,
      durationSeconds: input.durationSeconds,
      rpe: input.rpe,
      isWarmup: input.isWarmup ?? input.setType === "warmup",
      setType: input.setType ?? (input.isWarmup ? "warmup" : "standard"),
      tempo: input.tempo,
      notes: input.notes,
      completedAt: input.completedAt ? new Date(input.completedAt) : new Date()
    });

    await workout.save();
    return workout;
  }

  public async removeSet(workoutId: string, userId: string, workoutExerciseId: string, setId: string) {
    const workout = await this.findByIdForUser(workoutId, userId);

    if (!workout) {
      return null;
    }

    const workoutExercise = workout.exercises.find((exercise) => exercise._id.toString() === workoutExerciseId);

    if (!workoutExercise) {
      return workout;
    }

    workoutExercise.sets = workoutExercise.sets.filter((set) => set._id.toString() !== setId);
    workoutExercise.sets.forEach((set, index) => {
      set.order = index + 1;
    });

    await workout.save();
    return workout;
  }

  public async finish(workoutId: string, userId: string, input: FinishWorkoutDto) {
    const workout = await this.findByIdForUser(workoutId, userId);

    if (!workout) {
      return null;
    }

    const finishedAt = input.finishedAt ? new Date(input.finishedAt) : new Date();
    workout.status = "completed";
    workout.finishedAt = finishedAt;
    workout.durationSeconds =
      input.durationSeconds ?? Math.max(0, Math.round((finishedAt.getTime() - workout.startedAt.getTime()) / 1000));
    workout.notes = input.notes ?? workout.notes;

    await workout.save();
    return workout;
  }
}

export const workoutRepository = new WorkoutRepository();
