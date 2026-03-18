import mongoose, { Schema, Document } from "mongoose";
import { NodeType } from "../graph/types";

export interface IGraphNode extends Document {
  _id: mongoose.Types.ObjectId;
  nodeId: string;
  type: NodeType;
  label: string;
  properties: Record<string, unknown>;
  userId: string;
  source: string;
  version: number;
  relevanceScore: number;
  accessCount: number;
  lastAccessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const graphNodeSchema = new Schema<IGraphNode>(
  {
    nodeId: {
      type: String,
      required: [true, "Node ID is required"],
      index: true,
    },
    type: {
      type: String,
      required: [true, "Node type is required"],
      enum: Object.values(NodeType),
      index: true,
    },
    label: {
      type: String,
      required: [true, "Label is required"],
      trim: true,
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
    source: {
      type: String,
      default: "graph-builder",
    },
    version: {
      type: Number,
      default: 1,
    },
    relevanceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    accessCount: {
      type: Number,
      default: 0,
    },
    lastAccessedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

graphNodeSchema.index({ userId: 1, type: 1 });
graphNodeSchema.index({ userId: 1, nodeId: 1 }, { unique: true });
graphNodeSchema.index({ label: "text" });

export const GraphNodeModel = mongoose.model<IGraphNode>("GraphNode", graphNodeSchema);
