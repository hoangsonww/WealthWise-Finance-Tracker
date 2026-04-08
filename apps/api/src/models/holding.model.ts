import mongoose, { Schema, Document } from "mongoose";

export type AssetClass = "stocks" | "etf" | "bonds" | "crypto" | "real_estate" | "cash" | "other";

export interface IHolding extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  accountId?: mongoose.Types.ObjectId;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  quantity: number;
  costBasis: number;
  currentPrice: number;
  currency: string;
  sector?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const holdingSchema = new Schema<IHolding>(
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
      default: null,
    },
    symbol: {
      type: String,
      required: [true, "Symbol is required"],
      trim: true,
      uppercase: true,
      minlength: 1,
      maxlength: 20,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    assetClass: {
      type: String,
      required: [true, "Asset class is required"],
      enum: ["stocks", "etf", "bonds", "crypto", "real_estate", "cash", "other"],
      default: "stocks",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    costBasis: {
      type: Number,
      required: [true, "Cost basis is required"],
      min: [0, "Cost basis cannot be negative"],
    },
    currentPrice: {
      type: Number,
      required: [true, "Current price is required"],
      min: [0, "Current price cannot be negative"],
    },
    currency: {
      type: String,
      default: "USD",
      minlength: 3,
      maxlength: 3,
      uppercase: true,
    },
    sector: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

holdingSchema.index({ userId: 1, symbol: 1 });
holdingSchema.index({ userId: 1, assetClass: 1 });
holdingSchema.index({ userId: 1, accountId: 1 });

export const Holding = mongoose.model<IHolding>("Holding", holdingSchema);
