import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import mongoose from "mongoose";
import { Budget, IBudget } from "../models/budget.model";
import { Transaction } from "../models/transaction.model";
import { McpToolError } from "../utils/errors";

function formatBudget(budget: IBudget) {
  return {
    id: budget._id.toString(),
    userId: budget.userId.toString(),
    categoryId: budget.categoryId.toString(),
    amount: budget.amount,
    period: budget.period,
    alertThreshold: budget.alertThreshold,
    isActive: budget.isActive,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  };
}

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

function getPeriodStartDate(period: "monthly" | "weekly"): Date {
  const now = new Date();
  if (period === "monthly") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function registerBudgetTools(server: McpServer, getUserId: () => string) {
  server.tool("list_budgets", "List all budgets for the user", {}, async () => {
    const userId = getUserId();
    const budgets = await Budget.find({ userId }).sort({ createdAt: -1 });
    return textResult(budgets.map(formatBudget));
  });

  server.tool(
    "create_budget",
    "Create a new budget for a spending category",
    {
      categoryId: z.string().describe("Category ID to budget"),
      amount: z.number().positive().describe("Budget amount"),
      period: z.enum(["monthly", "weekly"]).describe("Budget period"),
      alertThreshold: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe("Alert threshold (0-1, default 0.8)"),
    },
    async (params) => {
      const userId = getUserId();
      const budget = await Budget.create({
        userId,
        categoryId: params.categoryId,
        amount: params.amount,
        period: params.period,
        alertThreshold: params.alertThreshold,
      });
      return textResult(formatBudget(budget));
    }
  );

  server.tool(
    "update_budget",
    "Update an existing budget, verifying ownership",
    {
      budgetId: z.string().describe("The budget ID to update"),
      categoryId: z.string().optional().describe("New category ID"),
      amount: z.number().positive().optional().describe("New amount"),
      period: z.enum(["monthly", "weekly"]).optional().describe("New period"),
      alertThreshold: z.number().min(0).max(1).optional().describe("New alert threshold"),
    },
    async ({ budgetId, ...data }) => {
      const userId = getUserId();
      const updateData: Record<string, unknown> = {};
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.period !== undefined) updateData.period = data.period;
      if (data.alertThreshold !== undefined) updateData.alertThreshold = data.alertThreshold;

      const budget = await Budget.findOneAndUpdate(
        { _id: budgetId, userId },
        { $set: updateData },
        { new: true, runValidators: true }
      );
      if (!budget) throw McpToolError.notFound("Budget not found");
      return textResult(formatBudget(budget));
    }
  );

  server.tool(
    "get_budget_summary",
    "Get active budgets with spent amount, remaining, and status for the current period",
    {},
    async () => {
      const userId = getUserId();
      const budgets = await Budget.find({ userId, isActive: true });

      const summaries = await Promise.all(
        budgets.map(async (budget) => {
          const periodStart = getPeriodStartDate(budget.period);
          const now = new Date();

          const result = await Transaction.aggregate([
            {
              $match: {
                userId: new mongoose.Types.ObjectId(userId),
                categoryId: budget.categoryId,
                type: "expense",
                date: { $gte: periodStart, $lte: now },
              },
            },
            {
              $group: {
                _id: null,
                totalSpent: { $sum: "$amount" },
              },
            },
          ]);

          const spent = result.length > 0 ? result[0].totalSpent : 0;
          const percentage = budget.amount > 0 ? spent / budget.amount : 0;

          let status: "under_budget" | "warning" | "over_budget";
          if (percentage >= 1) {
            status = "over_budget";
          } else if (percentage >= budget.alertThreshold) {
            status = "warning";
          } else {
            status = "under_budget";
          }

          return {
            ...formatBudget(budget),
            spent,
            remaining: Math.max(0, budget.amount - spent),
            percentage: Math.round(percentage * 10000) / 10000,
            status,
          };
        })
      );

      return textResult(summaries);
    }
  );
}
