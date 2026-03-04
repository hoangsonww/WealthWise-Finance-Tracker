import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Transaction, ITransaction } from "../models/transaction.model";
import { Account } from "../models/account.model";
import { McpToolError } from "../utils/errors";

function formatTransaction(tx: ITransaction) {
  return {
    id: tx._id.toString(),
    userId: tx.userId.toString(),
    accountId: tx.accountId.toString(),
    type: tx.type,
    amount: tx.amount,
    currency: tx.currency,
    categoryId: tx.categoryId.toString(),
    subcategory: tx.subcategory ?? null,
    description: tx.description,
    notes: tx.notes ?? null,
    date: tx.date.toISOString(),
    isRecurring: tx.isRecurring,
    recurringRuleId: tx.recurringRuleId?.toString() ?? null,
    tags: tx.tags,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  };
}

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

async function adjustAccountBalance(
  accountId: string,
  type: string,
  amount: number,
  operation: "add" | "remove",
) {
  let delta = 0;
  if (type === "income") {
    delta = operation === "add" ? amount : -amount;
  } else if (type === "expense") {
    delta = operation === "add" ? -amount : amount;
  }
  if (delta !== 0) {
    await Account.findByIdAndUpdate(accountId, { $inc: { balance: delta } });
  }
}

export function registerTransactionTools(
  server: McpServer,
  getUserId: () => string,
) {
  server.tool(
    "list_transactions",
    "List transactions with filtering, sorting, and pagination",
    {
      page: z.number().int().positive().optional().describe("Page number (default 1)"),
      limit: z.number().int().positive().max(100).optional().describe("Items per page (default 20)"),
      accountId: z.string().optional().describe("Filter by account ID"),
      categoryId: z.string().optional().describe("Filter by category ID"),
      type: z.enum(["income", "expense", "transfer"]).optional().describe("Filter by type"),
      startDate: z.string().optional().describe("Filter from date (ISO string)"),
      endDate: z.string().optional().describe("Filter to date (ISO string)"),
      minAmount: z.number().optional().describe("Minimum amount filter"),
      maxAmount: z.number().optional().describe("Maximum amount filter"),
      sortBy: z.string().optional().describe("Sort field (default: date)"),
      sortOrder: z.enum(["asc", "desc"]).optional().describe("Sort direction (default: desc)"),
    },
    async (params) => {
      const userId = getUserId();
      const page = params.page ?? 1;
      const limit = params.limit ?? 20;
      const skip = (page - 1) * limit;

      const query: Record<string, unknown> = { userId };
      if (params.accountId) query.accountId = params.accountId;
      if (params.categoryId) query.categoryId = params.categoryId;
      if (params.type) query.type = params.type;
      if (params.startDate || params.endDate) {
        const dateFilter: Record<string, Date> = {};
        if (params.startDate) dateFilter.$gte = new Date(params.startDate);
        if (params.endDate) dateFilter.$lte = new Date(params.endDate);
        query.date = dateFilter;
      }
      if (params.minAmount !== undefined || params.maxAmount !== undefined) {
        const amountFilter: Record<string, number> = {};
        if (params.minAmount !== undefined) amountFilter.$gte = params.minAmount;
        if (params.maxAmount !== undefined) amountFilter.$lte = params.maxAmount;
        query.amount = amountFilter;
      }

      const sortField = params.sortBy ?? "date";
      const sortDirection = params.sortOrder === "asc" ? 1 : -1;

      const [transactions, total] = await Promise.all([
        Transaction.find(query)
          .sort({ [sortField]: sortDirection })
          .skip(skip)
          .limit(limit),
        Transaction.countDocuments(query),
      ]);

      return textResult({
        data: transactions.map(formatTransaction),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    },
  );

  server.tool(
    "search_transactions",
    "Search transactions by description using regex matching",
    {
      query: z.string().describe("Search query for description"),
      page: z.number().int().positive().optional().describe("Page number (default 1)"),
      limit: z.number().int().positive().max(100).optional().describe("Items per page (default 20)"),
    },
    async (params) => {
      const userId = getUserId();
      const page = params.page ?? 1;
      const limit = params.limit ?? 20;
      const skip = (page - 1) * limit;

      const filter = {
        userId,
        description: { $regex: params.query, $options: "i" },
      };

      const [transactions, total] = await Promise.all([
        Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
        Transaction.countDocuments(filter),
      ]);

      return textResult({
        data: transactions.map(formatTransaction),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    },
  );

  server.tool(
    "create_transaction",
    "Create a new transaction and adjust the account balance",
    {
      accountId: z.string().describe("Account ID"),
      type: z.enum(["income", "expense", "transfer"]).describe("Transaction type"),
      amount: z.number().positive().describe("Transaction amount"),
      categoryId: z.string().describe("Category ID"),
      description: z.string().max(200).describe("Transaction description"),
      date: z.string().describe("Transaction date (ISO string)"),
      subcategory: z.string().optional().describe("Subcategory"),
      notes: z.string().optional().describe("Additional notes"),
      isRecurring: z.boolean().optional().describe("Is this recurring?"),
      tags: z.array(z.string()).optional().describe("Tags"),
    },
    async (params) => {
      const userId = getUserId();
      const account = await Account.findOne({
        _id: params.accountId,
        userId,
      });
      if (!account) throw McpToolError.notFound("Account not found");

      const transaction = await Transaction.create({
        userId,
        accountId: params.accountId,
        type: params.type,
        amount: params.amount,
        currency: account.currency,
        categoryId: params.categoryId,
        subcategory: params.subcategory,
        description: params.description,
        notes: params.notes,
        date: new Date(params.date),
        isRecurring: params.isRecurring ?? false,
        tags: params.tags ?? [],
      });

      await adjustAccountBalance(
        params.accountId,
        params.type,
        params.amount,
        "add",
      );

      return textResult(formatTransaction(transaction));
    },
  );

  server.tool(
    "get_transaction",
    "Get a transaction by ID, verifying ownership",
    { transactionId: z.string().describe("The transaction ID") },
    async ({ transactionId }) => {
      const userId = getUserId();
      const transaction = await Transaction.findOne({
        _id: transactionId,
        userId,
      });
      if (!transaction)
        throw McpToolError.notFound("Transaction not found");
      return textResult(formatTransaction(transaction));
    },
  );

  server.tool(
    "update_transaction",
    "Update a transaction and adjust account balance for amount/type changes",
    {
      transactionId: z.string().describe("The transaction ID to update"),
      accountId: z.string().optional().describe("New account ID"),
      type: z.enum(["income", "expense", "transfer"]).optional().describe("New type"),
      amount: z.number().positive().optional().describe("New amount"),
      categoryId: z.string().optional().describe("New category ID"),
      subcategory: z.string().nullable().optional().describe("New subcategory"),
      description: z.string().max(200).optional().describe("New description"),
      notes: z.string().nullable().optional().describe("New notes"),
      date: z.string().optional().describe("New date (ISO string)"),
      isRecurring: z.boolean().optional().describe("Is recurring"),
      tags: z.array(z.string()).optional().describe("New tags"),
    },
    async ({ transactionId, ...data }) => {
      const userId = getUserId();
      const existing = await Transaction.findOne({
        _id: transactionId,
        userId,
      });
      if (!existing)
        throw McpToolError.notFound("Transaction not found");

      if (data.accountId && data.accountId !== existing.accountId.toString()) {
        const newAccount = await Account.findOne({
          _id: data.accountId,
          userId,
        });
        if (!newAccount) throw McpToolError.notFound("Account not found");
      }

      await adjustAccountBalance(
        existing.accountId.toString(),
        existing.type,
        existing.amount,
        "remove",
      );

      const updateData: Record<string, unknown> = { ...data };
      if (data.date) updateData.date = new Date(data.date);

      const updated = await Transaction.findByIdAndUpdate(
        transactionId,
        { $set: updateData },
        { new: true, runValidators: true },
      );
      if (!updated)
        throw McpToolError.notFound("Transaction not found");

      await adjustAccountBalance(
        updated.accountId.toString(),
        updated.type,
        updated.amount,
        "add",
      );

      return textResult(formatTransaction(updated));
    },
  );

  server.tool(
    "delete_transaction",
    "Delete a transaction and reverse its effect on the account balance",
    { transactionId: z.string().describe("The transaction ID to delete") },
    async ({ transactionId }) => {
      const userId = getUserId();
      const transaction = await Transaction.findOneAndDelete({
        _id: transactionId,
        userId,
      });
      if (!transaction)
        throw McpToolError.notFound("Transaction not found");

      await adjustAccountBalance(
        transaction.accountId.toString(),
        transaction.type,
        transaction.amount,
        "remove",
      );

      return textResult(formatTransaction(transaction));
    },
  );
}
