import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import mongoose from "mongoose";
import { Account } from "../models/account.model";
import { Transaction } from "../models/transaction.model";

export function registerFinancialSummaryResource(
  server: McpServer,
  getUserId: () => string,
) {
  server.resource(
    "financial-summary",
    "wealthwise://summary",
    "Current month income, expenses, savings rate, and account balances",
    async () => {
      const userId = getUserId();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [accounts, monthlyAgg] = await Promise.all([
        Account.find({ userId, isArchived: false }),
        Transaction.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              type: { $in: ["income", "expense"] },
              date: { $gte: startOfMonth, $lte: now },
            },
          },
          {
            $group: {
              _id: "$type",
              total: { $sum: "$amount" },
            },
          },
        ]),
      ]);

      let income = 0;
      let expense = 0;
      for (const r of monthlyAgg) {
        if (r._id === "income") income = r.total;
        if (r._id === "expense") expense = r.total;
      }

      const savings = income - expense;
      const savingsRate =
        income > 0
          ? Math.round((savings / income) * 10000) / 100
          : 0;

      const summary = {
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        totalIncome: income,
        totalExpenses: expense,
        netSavings: savings,
        savingsRate,
        accounts: accounts.map((a) => ({
          id: a._id.toString(),
          name: a.name,
          type: a.type,
          balance: a.balance,
          currency: a.currency,
        })),
        totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
      };

      return {
        contents: [
          {
            uri: "wealthwise://summary",
            text: JSON.stringify(summary),
            mimeType: "application/json",
          },
        ],
      };
    },
  );
}
