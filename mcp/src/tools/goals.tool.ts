import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Goal, IGoal } from "../models/goal.model";
import { McpToolError } from "../utils/errors";

function formatGoal(goal: IGoal) {
  return {
    id: goal._id.toString(),
    userId: goal.userId.toString(),
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    deadline: goal.deadline ? goal.deadline.toISOString() : null,
    color: goal.color,
    icon: goal.icon,
    isCompleted: goal.isCompleted,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

export function registerGoalTools(
  server: McpServer,
  getUserId: () => string,
) {
  server.tool(
    "list_goals",
    "List all savings goals for the user",
    {},
    async () => {
      const userId = getUserId();
      const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
      return textResult(goals.map(formatGoal));
    },
  );

  server.tool(
    "create_goal",
    "Create a new savings goal",
    {
      name: z.string().max(50).describe("Goal name"),
      targetAmount: z.number().positive().describe("Target amount"),
      currentAmount: z
        .number()
        .min(0)
        .optional()
        .describe("Current amount (default 0)"),
      deadline: z
        .string()
        .optional()
        .describe("Deadline date (ISO string)"),
      color: z.string().optional().describe("Color hex code"),
      icon: z.string().optional().describe("Emoji icon"),
    },
    async (params) => {
      const userId = getUserId();
      const goal = await Goal.create({
        userId,
        name: params.name,
        targetAmount: params.targetAmount,
        currentAmount: params.currentAmount ?? 0,
        deadline: params.deadline ? new Date(params.deadline) : null,
        color: params.color,
        icon: params.icon,
      });
      return textResult(formatGoal(goal));
    },
  );

  server.tool(
    "update_goal",
    "Update a savings goal, verifying ownership",
    {
      goalId: z.string().describe("The goal ID to update"),
      name: z.string().max(50).optional().describe("New name"),
      targetAmount: z.number().positive().optional().describe("New target"),
      currentAmount: z
        .number()
        .min(0)
        .optional()
        .describe("New current amount"),
      deadline: z
        .string()
        .nullable()
        .optional()
        .describe("New deadline (ISO string or null)"),
      color: z.string().optional().describe("New color"),
      icon: z.string().optional().describe("New icon"),
    },
    async ({ goalId, ...data }) => {
      const userId = getUserId();
      const updateData: Record<string, unknown> = { ...data };
      if (data.deadline !== undefined) {
        updateData.deadline = data.deadline
          ? new Date(data.deadline)
          : null;
      }

      const goal = await Goal.findOneAndUpdate(
        { _id: goalId, userId },
        { $set: updateData },
        { new: true, runValidators: true },
      );
      if (!goal) throw McpToolError.notFound("Goal not found");
      return textResult(formatGoal(goal));
    },
  );

  server.tool(
    "delete_goal",
    "Delete a savings goal, verifying ownership",
    { goalId: z.string().describe("The goal ID to delete") },
    async ({ goalId }) => {
      const userId = getUserId();
      const goal = await Goal.findOneAndDelete({ _id: goalId, userId });
      if (!goal) throw McpToolError.notFound("Goal not found");
      return textResult(formatGoal(goal));
    },
  );

  server.tool(
    "add_goal_funds",
    "Add funds to a savings goal, auto-completing if target is reached",
    {
      goalId: z.string().describe("The goal ID"),
      amount: z.number().positive().describe("Amount to add"),
    },
    async ({ goalId, amount }) => {
      const userId = getUserId();
      const goal = await Goal.findOne({ _id: goalId, userId });
      if (!goal) throw McpToolError.notFound("Goal not found");
      if (goal.isCompleted) {
        throw McpToolError.badRequest("This goal is already completed");
      }

      goal.currentAmount += amount;
      if (goal.currentAmount >= goal.targetAmount) {
        goal.isCompleted = true;
      }
      await goal.save();

      return textResult(formatGoal(goal));
    },
  );
}
