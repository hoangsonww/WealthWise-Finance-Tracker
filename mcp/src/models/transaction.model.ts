import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  type: "income" | "expense" | "transfer";
  amount: number;
  currency: string;
  categoryId: mongoose.Types.ObjectId;
  subcategory?: string;
  description: string;
  notes?: string;
  date: Date;
  isRecurring: boolean;
  recurringRuleId?: mongoose.Types.ObjectId;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Account ID is required"],
    },
    type: {
      type: String,
      required: [true, "Transaction type is required"],
      enum: ["income", "expense", "transfer"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be positive"],
    },
    currency: {
      type: String,
      default: "USD",
      minlength: 3,
      maxlength: 3,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category ID is required"],
    },
    subcategory: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 200,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringRuleId: {
      type: Schema.Types.ObjectId,
      ref: "RecurringRule",
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
transactionSchema.index({ userId: 1, accountId: 1, date: -1 });
transactionSchema.index({ description: "text" });

export const Transaction = mongoose.model<ITransaction>("Transaction", transactionSchema);
