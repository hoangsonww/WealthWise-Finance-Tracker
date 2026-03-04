import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId | null;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense";
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: 1,
      maxlength: 30,
    },
    icon: {
      type: String,
      required: [true, "Icon is required"],
      trim: true,
    },
    color: {
      type: String,
      required: [true, "Color is required"],
    },
    type: {
      type: String,
      required: [true, "Category type is required"],
      enum: ["income", "expense"],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

categorySchema.index({ userId: 1, type: 1 });

export const Category = mongoose.model<ICategory>("Category", categorySchema);
