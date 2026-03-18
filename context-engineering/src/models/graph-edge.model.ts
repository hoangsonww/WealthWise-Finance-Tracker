import mongoose, { Schema, Document } from "mongoose";
import { EdgeType } from "../graph/types";

export interface IGraphEdge extends Document {
  _id: mongoose.Types.ObjectId;
  edgeId: string;
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
  properties: Record<string, unknown>;
  userId: string;
  sourceField: string;
  createdAt: Date;
  updatedAt: Date;
}

const graphEdgeSchema = new Schema<IGraphEdge>(
  {
    edgeId: {
      type: String,
      required: [true, "Edge ID is required"],
      index: true,
    },
    source: {
      type: String,
      required: [true, "Source node ID is required"],
      index: true,
    },
    target: {
      type: String,
      required: [true, "Target node ID is required"],
      index: true,
    },
    type: {
      type: String,
      required: [true, "Edge type is required"],
      enum: Object.values(EdgeType),
      index: true,
    },
    weight: {
      type: Number,
      required: true,
      default: 0.5,
      min: 0,
      max: 1,
    },
    properties: {
      type: Schema.Types.Mixed,
      default: {},
    },
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    sourceField: {
      type: String,
      default: "graph-builder",
    },
  },
  {
    timestamps: true,
  }
);

graphEdgeSchema.index({ userId: 1, type: 1 });
graphEdgeSchema.index({ userId: 1, source: 1, target: 1 });
graphEdgeSchema.index({ userId: 1, edgeId: 1 }, { unique: true });

export const GraphEdgeModel = mongoose.model<IGraphEdge>("GraphEdge", graphEdgeSchema);
