import mongoose, { Schema, Document } from "mongoose";

export interface IGoal extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  color: string;
  icon: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<IGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Goal name is required"],
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [0, "Target amount must be positive"],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, "Current amount cannot be negative"],
    },
    deadline: {
      type: Date,
      default: null,
    },
    color: {
      type: String,
      default: "#10b981",
    },
    icon: {
      type: String,
      default: "\uD83C\uDFAF",
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Goal = mongoose.model<IGoal>("Goal", goalSchema);
