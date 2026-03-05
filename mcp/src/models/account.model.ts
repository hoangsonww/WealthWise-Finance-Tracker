import mongoose, { Schema, Document } from "mongoose";

export interface IAccount extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  type: "checking" | "savings" | "credit_card" | "cash" | "investment";
  balance: number;
  currency: string;
  color: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    type: {
      type: String,
      required: [true, "Account type is required"],
      enum: ["checking", "savings", "credit_card", "cash", "investment"],
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
      minlength: 3,
      maxlength: 3,
    },
    color: {
      type: String,
      default: "#6366f1",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

accountSchema.index({ userId: 1, isArchived: 1 });

export const Account = mongoose.model<IAccount>("Account", accountSchema);
