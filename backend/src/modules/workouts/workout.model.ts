import { model, Schema, Types } from "mongoose";
import type { TempoDto, WorkoutSetType, WorkoutStatus } from "./workout.types.js";

export type WorkoutSetDocument = {
  _id: Types.ObjectId;
  order: number;
  reps: number;
  weight: number;
  restTimeSeconds?: number;
  durationSeconds?: number;
  rpe?: number;
  isWarmup: boolean;
  setType: WorkoutSetType;
  tempo?: TempoDto;
  notes?: string;
  completedAt?: Date;
};

export type WorkoutExerciseDocument = {
  _id: Types.ObjectId;
  exerciseId: Types.ObjectId;
  order: number;
  supersetGroupId?: string;
  notes?: string;
  sets: WorkoutSetDocument[];
};

export type WorkoutDocument = {
  userId: Types.ObjectId;
  name: string;
  status: WorkoutStatus;
  startedAt: Date;
  finishedAt?: Date;
  durationSeconds?: number;
  notes?: string;
  exercises: WorkoutExerciseDocument[];
  createdAt: Date;
  updatedAt: Date;
};

const tempoSchema = new Schema<TempoDto>(
  {
    eccentric: Number,
    pauseBottom: Number,
    concentric: Number,
    pauseTop: Number
  },
  {
    _id: false
  }
);

const workoutSetSchema = new Schema<WorkoutSetDocument>(
  {
    order: {
      type: Number,
      required: true
    },
    reps: {
      type: Number,
      required: true
    },
    weight: {
      type: Number,
      required: true
    },
    restTimeSeconds: Number,
    durationSeconds: Number,
    rpe: Number,
    isWarmup: {
      type: Boolean,
      required: true,
      default: false
    },
    setType: {
      type: String,
      enum: ["standard", "warmup", "dropset"],
      required: true,
      default: "standard"
    },
    tempo: tempoSchema,
    notes: {
      type: String,
      trim: true
    },
    completedAt: Date
  },
  {
    _id: true
  }
);

const workoutExerciseSchema = new Schema<WorkoutExerciseDocument>(
  {
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
      index: true
    },
    order: {
      type: Number,
      required: true
    },
    supersetGroupId: {
      type: String,
      trim: true,
      index: true
    },
    notes: {
      type: String,
      trim: true
    },
    sets: {
      type: [workoutSetSchema],
      default: []
    }
  },
  {
    _id: true
  }
);

const workoutSchema = new Schema<WorkoutDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["active", "completed", "discarded"],
      required: true,
      default: "active",
      index: true
    },
    startedAt: {
      type: Date,
      required: true,
      index: true
    },
    finishedAt: Date,
    durationSeconds: Number,
    notes: {
      type: String,
      trim: true
    },
    exercises: {
      type: [workoutExerciseSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

workoutSchema.index({ userId: 1, status: 1, startedAt: -1 });
workoutSchema.index({ userId: 1, finishedAt: -1 });
workoutSchema.index({ userId: 1, "exercises.exerciseId": 1, startedAt: -1 });

export const WorkoutModel = model<WorkoutDocument>("Workout", workoutSchema);
