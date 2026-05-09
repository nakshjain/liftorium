import { model, Schema } from "mongoose";

export type ExerciseDocument = {
  name: string;
  description: string;
  category: string;
  equipment: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  tips: string[];
  mediaUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

const exerciseSchema = new Schema<ExerciseDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    equipment: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    targetMuscles: {
      type: [String],
      required: true,
      index: true
    },
    secondaryMuscles: {
      type: [String],
      default: [],
      index: true
    },
    instructions: {
      type: [String],
      required: true
    },
    tips: {
      type: [String],
      default: []
    },
    mediaUrl: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

exerciseSchema.index({ name: "text" });
exerciseSchema.index({ category: 1, equipment: 1 });
exerciseSchema.index({ targetMuscles: 1, equipment: 1 });

export const ExerciseModel = model<ExerciseDocument>("Exercise", exerciseSchema);
