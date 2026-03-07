import { z } from "zod";

export const advisorChatRoleEnum = z.enum(["user", "assistant"]);

export const advisorChatHistoryItemSchema = z.object({
  role: advisorChatRoleEnum,
  content: z
    .string()
    .trim()
    .min(1, "Message content is required")
    .max(4000, "Message content must be at most 4000 characters"),
});

export const advisorChatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(4000, "Message must be at most 4000 characters"),
  history: z.array(advisorChatHistoryItemSchema).max(16).default([]),
});

export const advisorChatModelOutputSchema = z.object({
  reply: z
    .string()
    .trim()
    .min(1, "Reply is required")
    .max(6000, "Reply must be at most 6000 characters"),
});

export const advisorContextStatsSchema = z.object({
  accountCount: z.number().int().nonnegative(),
  transactionCount: z.number().int().nonnegative(),
  categoryCount: z.number().int().nonnegative(),
  budgetCount: z.number().int().nonnegative(),
  goalCount: z.number().int().nonnegative(),
  recurringCount: z.number().int().nonnegative(),
  netWorth: z.number(),
  totalAssets: z.number().nonnegative(),
  totalDebt: z.number().nonnegative(),
  incomeThisMonth: z.number().nonnegative(),
  spendingThisMonth: z.number().nonnegative(),
  savingsThisMonth: z.number(),
  savingsRate: z.number(),
  upcomingBills30Days: z.number().int().nonnegative(),
  currency: z.string().length(3),
});

export const advisorChatResponseSchema = z.object({
  reply: z.string(),
  model: z.string(),
  generatedAt: z.string().datetime(),
  contextStats: advisorContextStatsSchema,
});
