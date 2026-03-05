import mongoose, { Schema, Document } from "mongoose";

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  amount: number;
  period: "monthly" | "weekly";
  alertThreshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category ID is required"],
    },
    amount: {
      type: Number,
      required: [true, "Budget amount is required"],
      min: [0, "Budget amount must be positive"],
    },
    period: {
      type: String,
      required: [true, "Budget period is required"],
      enum: ["monthly", "weekly"],
    },
    alertThreshold: {
      type: Number,
      default: 0.8,
      min: 0,
      max: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

budgetSchema.index({ userId: 1, categoryId: 1 });

export const Budget = mongoose.model<IBudget>("Budget", budgetSchema);
