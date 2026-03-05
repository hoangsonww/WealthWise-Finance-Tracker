import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import mongoose from "mongoose";
import { Transaction } from "../models/transaction.model";
import { Account } from "../models/account.model";

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

export function registerAnalyticsTools(server: McpServer, getUserId: () => string) {
  server.tool(
    "spending_by_category",
    "Get spending breakdown by category for a date range, with percentages",
    {
      startDate: z.string().describe("Start date (ISO string)"),
      endDate: z.string().describe("End date (ISO string)"),
    },
    async ({ startDate, endDate }) => {
      const userId = getUserId();
      const pipeline = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: "expense",
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        },
        {
          $group: {
            _id: "$categoryId",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $project: {
            _id: 0,
            categoryId: { $toString: "$_id" },
            categoryName: "$category.name",
            categoryIcon: "$category.icon",
            categoryColor: "$category.color",
            total: 1,
            count: 1,
          },
        },
        { $sort: { total: -1 as const } },
      ];

      const results = await Transaction.aggregate(pipeline);
      const grandTotal = results.reduce((sum: number, r: { total: number }) => sum + r.total, 0);

      return textResult(
        results.map(
          (r: {
            categoryId: string;
            categoryName: string;
            categoryIcon: string;
            categoryColor: string;
            total: number;
            count: number;
          }) => ({
            categoryId: r.categoryId,
            categoryName: r.categoryName,
            categoryIcon: r.categoryIcon,
            categoryColor: r.categoryColor,
            amount: r.total,
            transactionCount: r.count,
            percentage: grandTotal > 0 ? Math.round((r.total / grandTotal) * 10000) / 100 : 0,
          })
        )
      );
    }
  );

  server.tool(
    "income_vs_expense",
    "Get monthly income vs expense comparison for the last N months",
    {
      months: z.number().int().positive().describe("Number of months to look back"),
    },
    async ({ months }) => {
      const userId = getUserId();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const pipeline = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: { $in: ["income", "expense"] },
            date: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              type: "$type",
            },
            total: { $sum: "$amount" },
          },
        },
        {
          $sort: {
            "_id.year": 1 as const,
            "_id.month": 1 as const,
          },
        },
      ];

      const raw = await Transaction.aggregate(pipeline);
      const monthlyMap = new Map<
        string,
        { year: number; month: number; income: number; expense: number }
      >();

      for (const entry of raw) {
        const key = `${entry._id.year}-${entry._id.month}`;
        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, {
            year: entry._id.year,
            month: entry._id.month,
            income: 0,
            expense: 0,
          });
        }
        const record = monthlyMap.get(key)!;
        if (entry._id.type === "income") {
          record.income = entry.total;
        } else {
          record.expense = entry.total;
        }
      }

      const result = Array.from(monthlyMap.values())
        .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
        .map((entry) => ({
          month: `${entry.year}-${String(entry.month).padStart(2, "0")}`,
          income: entry.income,
          expense: entry.expense,
          net: entry.income - entry.expense,
        }));

      return textResult(result);
    }
  );

  server.tool(
    "monthly_summary",
    "Get total income, expenses, savings, and savings rate for a specific month",
    {
      year: z.number().int().describe("Year (e.g. 2024)"),
      month: z.number().int().min(1).max(12).describe("Month (1-12)"),
    },
    async ({ year, month }) => {
      const userId = getUserId();
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const pipeline = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: { $in: ["income", "expense"] },
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ];

      const results = await Transaction.aggregate(pipeline);

      let income = 0;
      let expense = 0;
      let incomeCount = 0;
      let expenseCount = 0;

      for (const r of results) {
        if (r._id === "income") {
          income = r.total;
          incomeCount = r.count;
        } else if (r._id === "expense") {
          expense = r.total;
          expenseCount = r.count;
        }
      }

      const savings = income - expense;
      const savingsRate = income > 0 ? Math.round((savings / income) * 10000) / 100 : 0;

      return textResult({
        totalIncome: income,
        totalExpenses: expense,
        netSavings: savings,
        savingsRate,
        transactionCount: incomeCount + expenseCount,
      });
    }
  );

  server.tool(
    "get_trends",
    "Get monthly income, expense, and savings rate trends over N months",
    {
      months: z.number().int().positive().describe("Number of months to analyze"),
    },
    async ({ months }) => {
      const userId = getUserId();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const pipeline = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: { $in: ["income", "expense"] },
            date: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              type: "$type",
            },
            total: { $sum: "$amount" },
          },
        },
        {
          $sort: {
            "_id.year": 1 as const,
            "_id.month": 1 as const,
          },
        },
      ];

      const raw = await Transaction.aggregate(pipeline);
      const monthlyMap = new Map<
        string,
        { year: number; month: number; income: number; expense: number }
      >();

      for (const entry of raw) {
        const key = `${entry._id.year}-${entry._id.month}`;
        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, {
            year: entry._id.year,
            month: entry._id.month,
            income: 0,
            expense: 0,
          });
        }
        const record = monthlyMap.get(key)!;
        if (entry._id.type === "income") {
          record.income = entry.total;
        } else {
          record.expense = entry.total;
        }
      }

      const sorted = Array.from(monthlyMap.values()).sort((a, b) =>
        a.year !== b.year ? a.year - b.year : a.month - b.month
      );

      let runningNetWorth = 0;
      const result = sorted.map((entry) => {
        const net = entry.income - entry.expense;
        runningNetWorth += net;
        const savingsRate = entry.income > 0 ? Math.round((net / entry.income) * 10000) / 100 : 0;
        return {
          month: `${entry.year}-${String(entry.month).padStart(2, "0")}`,
          income: entry.income,
          expense: entry.expense,
          savingsRate,
          netWorth: runningNetWorth,
        };
      });

      return textResult(result);
    }
  );

  server.tool(
    "spending_by_day_of_week",
    "Get average spending patterns by day of the week",
    {
      startDate: z.string().describe("Start date (ISO string)"),
      endDate: z.string().describe("End date (ISO string)"),
    },
    async ({ startDate, endDate }) => {
      const userId = getUserId();
      const pipeline = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: "expense",
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        },
        {
          $group: {
            _id: { $dayOfWeek: "$date" },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 as const } },
      ];

      const results = await Transaction.aggregate(pipeline);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      return textResult(
        dayNames.map((name, index) => {
          const found = results.find((r: { _id: number }) => r._id === index + 1);
          return {
            day: name,
            total: found ? found.total : 0,
            count: found ? found.count : 0,
            average:
              found && found.count > 0 ? Math.round((found.total / found.count) * 100) / 100 : 0,
          };
        })
      );
    }
  );

  server.tool(
    "category_monthly_breakdown",
    "Get expense breakdown by top categories per month over N months",
    {
      months: z.number().int().positive().describe("Number of months to analyze"),
    },
    async ({ months }) => {
      const userId = getUserId();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const pipeline = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: "expense",
            date: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              categoryId: "$categoryId",
            },
            total: { $sum: "$amount" },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id.categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $sort: {
            "_id.year": 1 as const,
            "_id.month": 1 as const,
            total: -1 as const,
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            categoryName: "$category.name",
            categoryColor: "$category.color",
            total: 1,
          },
        },
      ];

      const results = await Transaction.aggregate(pipeline);

      const categoryTotals = new Map<string, number>();
      for (const r of results) {
        categoryTotals.set(r.categoryName, (categoryTotals.get(r.categoryName) ?? 0) + r.total);
      }
      const topCategories = Array.from(categoryTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name]) => name);

      const colorMap = new Map<string, string>();
      for (const r of results) {
        if (!colorMap.has(r.categoryName)) {
          colorMap.set(r.categoryName, r.categoryColor);
        }
      }

      const monthlyMap = new Map<string, Record<string, number | string>>();
      for (const r of results) {
        const key = `${r.year}-${String(r.month).padStart(2, "0")}`;
        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, { month: key });
        }
        const record = monthlyMap.get(key)!;
        if (topCategories.includes(r.categoryName)) {
          record[r.categoryName] = ((record[r.categoryName] as number) ?? 0) + r.total;
        } else {
          record["Other"] = ((record["Other"] as number) ?? 0) + r.total;
        }
      }

      return textResult({
        months: Array.from(monthlyMap.values()).sort((a, b) =>
          (a.month as string).localeCompare(b.month as string)
        ),
        categories: topCategories,
        colors: Object.fromEntries(
          topCategories.map((name) => [name, colorMap.get(name) ?? "#94a3b8"])
        ),
      });
    }
  );

  server.tool(
    "get_net_worth",
    "Get net worth progression over time from all transaction history",
    {},
    async () => {
      const userId = getUserId();
      const accounts = await Account.find({ userId });
      if (accounts.length === 0) return textResult([]);

      const pipeline = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
            },
            income: {
              $sum: {
                $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
              },
            },
            expense: {
              $sum: {
                $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
              },
            },
          },
        },
        {
          $sort: {
            "_id.year": 1 as const,
            "_id.month": 1 as const,
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            income: 1,
            expense: 1,
            net: { $subtract: ["$income", "$expense"] },
          },
        },
      ];

      const monthly = await Transaction.aggregate(pipeline);

      let runningTotal = 0;
      return textResult(
        monthly.map((entry: { year: number; month: number; net: number }) => {
          runningTotal += entry.net;
          return {
            date: `${entry.year}-${String(entry.month).padStart(2, "0")}`,
            amount: runningTotal,
          };
        })
      );
    }
  );
}
