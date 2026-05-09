import type { FilterQuery, HydratedDocument, UpdateQuery } from "mongoose";
import { ExerciseModel, type ExerciseDocument } from "./exercise.model.js";
import type { CreateExerciseDto, ListExercisesQueryDto, UpdateExerciseDto } from "./exercise.types.js";

export type ExerciseEntity = HydratedDocument<ExerciseDocument>;

export class ExerciseRepository {
  public async create(input: CreateExerciseDto) {
    return ExerciseModel.create(input);
  }

  public async findById(exerciseId: string) {
    return ExerciseModel.findById(exerciseId).exec();
  }

  public async list(query: ListExercisesQueryDto) {
    const filter = this.buildFilter(query);
    const skip = (query.page - 1) * query.limit;

    if (query.search) {
      const [items, total] = await Promise.all([
        ExerciseModel.find(filter, { score: { $meta: "textScore" } })
          .sort({ score: { $meta: "textScore" } })
          .skip(skip)
          .limit(query.limit)
          .exec(),
        ExerciseModel.countDocuments(filter).exec()
      ]);

      return {
        items,
        total
      };
    }

    const [items, total] = await Promise.all([
      ExerciseModel.find(filter).sort({ name: 1 }).skip(skip).limit(query.limit).exec(),
      ExerciseModel.countDocuments(filter).exec()
    ]);

    return {
      items,
      total
    };
  }

  public async updateById(exerciseId: string, input: UpdateExerciseDto) {
    const update: UpdateQuery<ExerciseDocument> = {
      $set: input
    };

    return ExerciseModel.findByIdAndUpdate(exerciseId, update, {
      new: true,
      runValidators: true
    }).exec();
  }

  public async deleteById(exerciseId: string) {
    return ExerciseModel.findByIdAndDelete(exerciseId).exec();
  }

  private buildFilter(query: ListExercisesQueryDto): FilterQuery<ExerciseDocument> {
    const filter: FilterQuery<ExerciseDocument> = {};

    if (query.search) {
      filter.$text = {
        $search: query.search
      };
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.equipment) {
      filter.equipment = query.equipment;
    }

    if (query.muscleGroup) {
      filter.$or = [{ targetMuscles: query.muscleGroup }, { secondaryMuscles: query.muscleGroup }];
    }

    return filter;
  }
}

export const exerciseRepository = new ExerciseRepository();
