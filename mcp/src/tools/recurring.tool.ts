import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RecurringRule, IRecurringRule } from "../models/recurring-rule.model";
import { Transaction } from "../models/transaction.model";
import { Account } from "../models/account.model";
import { McpToolError } from "../utils/errors";

function formatRule(rule: IRecurringRule) {
  return {
    id: rule._id.toString(),
    userId: rule.userId.toString(),
    accountId: rule.accountId.toString(),
    categoryId: rule.categoryId.toString(),
    type: rule.type,
    amount: rule.amount,
    description: rule.description,
    frequency: rule.frequency,
    startDate: rule.startDate.toISOString(),
    nextDueDate: rule.nextDueDate.toISOString(),
    endDate: rule.endDate ? rule.endDate.toISOString() : null,
    isActive: rule.isActive,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

function advanceDate(current: Date, frequency: string): Date {
  const next = new Date(current);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
}

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

export function registerRecurringTools(server: McpServer, getUserId: () => string) {
  server.tool("list_recurring", "List all recurring rules for the user", {}, async () => {
    const userId = getUserId();
    const rules = await RecurringRule.find({ userId }).sort({
      nextDueDate: 1,
    });
    return textResult(rules.map(formatRule));
  });

  server.tool(
    "create_recurring",
    "Create a new recurring transaction rule",
    {
      accountId: z.string().describe("Account ID"),
      categoryId: z.string().describe("Category ID"),
      type: z.enum(["income", "expense"]).describe("Transaction type"),
      amount: z.number().positive().describe("Amount"),
      description: z.string().max(200).describe("Description"),
      frequency: z
        .enum(["daily", "weekly", "biweekly", "monthly", "yearly"])
        .describe("Recurrence frequency"),
      startDate: z.string().describe("Start date (ISO string)"),
      endDate: z.string().optional().describe("End date (ISO string, optional)"),
    },
    async (params) => {
      const userId = getUserId();
      const account = await Account.findOne({
        _id: params.accountId,
        userId,
      });
      if (!account) throw McpToolError.notFound("Account not found");

      const rule = await RecurringRule.create({
        userId,
        accountId: params.accountId,
        categoryId: params.categoryId,
        type: params.type,
        amount: params.amount,
        description: params.description,
        frequency: params.frequency,
        startDate: new Date(params.startDate),
        nextDueDate: new Date(params.startDate),
        endDate: params.endDate ? new Date(params.endDate) : null,
      });

      return textResult(formatRule(rule));
    }
  );

  server.tool(
    "get_upcoming_bills",
    "Get recurring payments due within the next 30 days",
    {},
    async () => {
      const userId = getUserId();
      const now = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);

      const rules = await RecurringRule.find({
        userId,
        isActive: true,
        nextDueDate: { $gte: now, $lte: thirtyDays },
      }).sort({ nextDueDate: 1 });

      return textResult(rules.map(formatRule));
    }
  );

  server.tool(
    "mark_recurring_paid",
    "Mark a recurring rule as paid: creates a transaction and advances the due date",
    { ruleId: z.string().describe("The recurring rule ID") },
    async ({ ruleId }) => {
      const userId = getUserId();
      const rule = await RecurringRule.findOne({ _id: ruleId, userId });
      if (!rule) throw McpToolError.notFound("Recurring rule not found");

      if (!rule.isActive) {
        throw McpToolError.badRequest("This recurring rule is no longer active");
      }

      const account = await Account.findOne({
        _id: rule.accountId,
        userId,
      });
      if (!account) {
        throw McpToolError.notFound("The account associated with this rule was not found");
      }

      const transaction = await Transaction.create({
        userId: rule.userId,
        accountId: rule.accountId,
        type: rule.type,
        amount: rule.amount,
        currency: account.currency,
        categoryId: rule.categoryId,
        description: rule.description,
        date: rule.nextDueDate,
        isRecurring: true,
        recurringRuleId: rule._id,
        tags: [],
      });

      const balanceDelta = rule.type === "income" ? rule.amount : -rule.amount;
      await Account.findByIdAndUpdate(rule.accountId, {
        $inc: { balance: balanceDelta },
      });

      const newNextDueDate = advanceDate(rule.nextDueDate, rule.frequency);
      if (rule.endDate && newNextDueDate > rule.endDate) {
        rule.isActive = false;
      }
      rule.nextDueDate = newNextDueDate;
      await rule.save();

      return textResult({
        rule: formatRule(rule),
        transaction: {
          id: transaction._id.toString(),
          description: transaction.description,
          amount: transaction.amount,
          date: transaction.date.toISOString(),
        },
      });
    }
  );

  server.tool(
    "delete_recurring",
    "Delete a recurring rule, verifying ownership",
    { ruleId: z.string().describe("The recurring rule ID to delete") },
    async ({ ruleId }) => {
      const userId = getUserId();
      const rule = await RecurringRule.findOneAndDelete({
        _id: ruleId,
        userId,
      });
      if (!rule) throw McpToolError.notFound("Recurring rule not found");
      return textResult(formatRule(rule));
    }
  );
}
