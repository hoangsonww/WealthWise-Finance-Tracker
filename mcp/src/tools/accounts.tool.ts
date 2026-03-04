import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import mongoose from "mongoose";
import { Account, IAccount } from "../models/account.model";
import { Transaction } from "../models/transaction.model";
import { McpToolError } from "../utils/errors";

function formatAccount(account: IAccount) {
  return {
    id: account._id.toString(),
    userId: account.userId.toString(),
    name: account.name,
    type: account.type,
    balance: account.balance,
    currency: account.currency,
    color: account.color,
    isArchived: account.isArchived,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

export function registerAccountTools(
  server: McpServer,
  getUserId: () => string,
) {
  server.tool(
    "list_accounts",
    "List all non-archived accounts for the user, sorted by creation date descending",
    {},
    async () => {
      const userId = getUserId();
      const accounts = await Account.find({
        userId,
        isArchived: false,
      }).sort({ createdAt: -1 });
      return textResult(accounts.map(formatAccount));
    },
  );

  server.tool(
    "get_account",
    "Get a single account by ID, verifying ownership",
    { accountId: z.string().describe("The account ID to retrieve") },
    async ({ accountId }) => {
      const userId = getUserId();
      const account = await Account.findOne({ _id: accountId, userId });
      if (!account) throw McpToolError.notFound("Account not found");
      return textResult(formatAccount(account));
    },
  );

  server.tool(
    "create_account",
    "Create a new financial account",
    {
      name: z.string().describe("Account name"),
      type: z
        .enum(["checking", "savings", "credit_card", "cash", "investment"])
        .describe("Account type"),
      balance: z.number().optional().describe("Initial balance (default 0)"),
      currency: z
        .string()
        .length(3)
        .optional()
        .describe("Currency code (default USD)"),
      color: z.string().optional().describe("Color hex code"),
    },
    async ({ name, type, balance, currency, color }) => {
      const userId = getUserId();
      const account = await Account.create({
        userId,
        name,
        type,
        balance,
        currency,
        color,
      });
      return textResult(formatAccount(account));
    },
  );

  server.tool(
    "update_account",
    "Update an existing account, verifying ownership",
    {
      accountId: z.string().describe("The account ID to update"),
      name: z.string().optional().describe("New account name"),
      type: z
        .enum(["checking", "savings", "credit_card", "cash", "investment"])
        .optional()
        .describe("New account type"),
      balance: z.number().optional().describe("New balance"),
      currency: z
        .string()
        .length(3)
        .optional()
        .describe("New currency code"),
      color: z.string().optional().describe("New color hex code"),
    },
    async ({ accountId, ...data }) => {
      const userId = getUserId();
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.balance !== undefined) updateData.balance = data.balance;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.color !== undefined) updateData.color = data.color;

      const account = await Account.findOneAndUpdate(
        { _id: accountId, userId },
        { $set: updateData },
        { new: true, runValidators: true },
      );
      if (!account) throw McpToolError.notFound("Account not found");
      return textResult(formatAccount(account));
    },
  );

  server.tool(
    "archive_account",
    "Soft-delete (archive) an account, verifying ownership",
    { accountId: z.string().describe("The account ID to archive") },
    async ({ accountId }) => {
      const userId = getUserId();
      const account = await Account.findOneAndUpdate(
        { _id: accountId, userId },
        { $set: { isArchived: true } },
        { new: true },
      );
      if (!account) throw McpToolError.notFound("Account not found");
      return textResult(formatAccount(account));
    },
  );

  server.tool(
    "get_balance_history",
    "Get monthly balance snapshots for an account from transaction aggregation",
    { accountId: z.string().describe("The account ID") },
    async ({ accountId }) => {
      const userId = getUserId();
      const account = await Account.findOne({ _id: accountId, userId });
      if (!account) throw McpToolError.notFound("Account not found");

      const pipeline = [
        {
          $match: {
            accountId: new mongoose.Types.ObjectId(accountId),
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

      const history = await Transaction.aggregate(pipeline);

      let runningBalance = 0;
      const balanceHistory = history.map(
        (entry: {
          year: number;
          month: number;
          income: number;
          expense: number;
          net: number;
        }) => {
          runningBalance += entry.net;
          return {
            year: entry.year,
            month: entry.month,
            balance: runningBalance,
            income: entry.income,
            expense: entry.expense,
          };
        },
      );

      return textResult(balanceHistory);
    },
  );
}
