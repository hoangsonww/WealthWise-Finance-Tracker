import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import mongoose from "mongoose";
import { Budget } from "../models/budget.model";
import { Transaction } from "../models/transaction.model";

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

export function registerBudgetStatusResource(server: McpServer, getUserId: () => string) {
  server.resource(
    "budget-status",
    "wealthwise://budget-status",
    "Active budgets with spent and remaining amounts",
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

          let status: string;
          if (percentage >= 1) status = "over_budget";
          else if (percentage >= budget.alertThreshold) status = "warning";
          else status = "under_budget";

          return {
            id: budget._id.toString(),
            categoryId: budget.categoryId.toString(),
            amount: budget.amount,
            period: budget.period,
            spent,
            remaining: Math.max(0, budget.amount - spent),
            percentage: Math.round(percentage * 10000) / 10000,
            status,
          };
        })
      );

      return {
        contents: [
          {
            uri: "wealthwise://budget-status",
            text: JSON.stringify(summaries),
            mimeType: "application/json",
          },
        ],
      };
    }
  );
}
