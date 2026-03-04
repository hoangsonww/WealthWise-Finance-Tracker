import mongoose, { Schema, Document } from "mongoose";

export interface IRecurringRule extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  type: "income" | "expense";
  amount: number;
  description: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
  startDate: Date;
  nextDueDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const recurringRuleSchema = new Schema<IRecurringRule>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Account ID is required"],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category ID is required"],
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: ["income", "expense"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be positive"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 200,
    },
    frequency: {
      type: String,
      required: [true, "Frequency is required"],
      enum: ["daily", "weekly", "biweekly", "monthly", "yearly"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    nextDueDate: {
      type: Date,
      required: [true, "Next due date is required"],
    },
    endDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

recurringRuleSchema.index({ userId: 1, isActive: 1, nextDueDate: 1 });

export const RecurringRule = mongoose.model<IRecurringRule>(
  "RecurringRule",
  recurringRuleSchema,
);
