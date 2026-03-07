import { z } from "zod";
import { createAccountSchema } from "./account.schema";
import { budgetPeriodEnum } from "./budget.schema";
import { createCategorySchema } from "./category.schema";
import { createGoalSchema } from "./goal.schema";
import { frequencyEnum, recurringTypeEnum } from "./recurring.schema";

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

const isoDateString = z.string().refine(
  (value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  },
  { message: "Must be a valid ISO date string" }
);

const namedReferenceSchema = z
  .string()
  .trim()
  .min(1, "A name is required")
  .max(80, "Names must be at most 80 characters");

const actionTitleSchema = z
  .string()
  .trim()
  .min(1, "Action title is required")
  .max(120, "Action title must be at most 120 characters");

const actionRationaleSchema = z
  .string()
  .trim()
  .min(1, "Action rationale is required")
  .max(300, "Action rationale must be at most 300 characters");

export const advisorActionKindEnum = z.enum([
  "create_account",
  "create_category",
  "create_budget",
  "create_goal",
  "create_recurring",
  "create_transaction",
]);

export const advisorCreateAccountActionDataSchema = createAccountSchema;

export const advisorCreateCategoryActionDataSchema = createCategorySchema;

export const advisorCreateBudgetActionDataSchema = z.object({
  categoryName: namedReferenceSchema,
  amount: z
    .number()
    .positive("Budget amount must be a positive number")
    .finite("Budget amount must be a finite number"),
  period: budgetPeriodEnum,
  alertThreshold: z
    .number()
    .min(0, "Alert threshold must be between 0 and 1")
    .max(1, "Alert threshold must be between 0 and 1")
    .default(0.8),
});

export const advisorCreateGoalActionDataSchema = createGoalSchema;

export const advisorCreateRecurringActionDataSchema = z.object({
  accountName: namedReferenceSchema,
  categoryName: namedReferenceSchema,
  type: recurringTypeEnum,
  amount: z
    .number()
    .positive("Amount must be a positive number")
    .finite("Amount must be a finite number"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Description must be at most 200 characters"),
  frequency: frequencyEnum,
  startDate: isoDateString,
  endDate: isoDateString.optional(),
});

export const advisorCreateTransactionActionDataSchema = z.object({
  accountName: namedReferenceSchema,
  categoryName: namedReferenceSchema,
  type: recurringTypeEnum,
  amount: z
    .number()
    .positive("Amount must be a positive number")
    .finite("Amount must be a finite number"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Description must be at most 200 characters"),
  date: isoDateString,
  subcategory: z.string().trim().max(50, "Subcategory must be at most 50 characters").optional(),
  notes: z.string().trim().max(500, "Notes must be at most 500 characters").optional(),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(10, "A transaction can have at most 10 tags")
    .default([]),
});

const createAccountPlannedActionSchema = z.object({
  kind: z.literal("create_account"),
  title: actionTitleSchema,
  rationale: actionRationaleSchema,
  data: advisorCreateAccountActionDataSchema,
});

const createCategoryPlannedActionSchema = z.object({
  kind: z.literal("create_category"),
  title: actionTitleSchema,
  rationale: actionRationaleSchema,
  data: advisorCreateCategoryActionDataSchema,
});

const createBudgetPlannedActionSchema = z.object({
  kind: z.literal("create_budget"),
  title: actionTitleSchema,
  rationale: actionRationaleSchema,
  data: advisorCreateBudgetActionDataSchema,
});

const createGoalPlannedActionSchema = z.object({
  kind: z.literal("create_goal"),
  title: actionTitleSchema,
  rationale: actionRationaleSchema,
  data: advisorCreateGoalActionDataSchema,
});

const createRecurringPlannedActionSchema = z.object({
  kind: z.literal("create_recurring"),
  title: actionTitleSchema,
  rationale: actionRationaleSchema,
  data: advisorCreateRecurringActionDataSchema,
});

const createTransactionPlannedActionSchema = z.object({
  kind: z.literal("create_transaction"),
  title: actionTitleSchema,
  rationale: actionRationaleSchema,
  data: advisorCreateTransactionActionDataSchema,
});

export const advisorPlannedActionSchema = z.discriminatedUnion("kind", [
  createAccountPlannedActionSchema,
  createCategoryPlannedActionSchema,
  createBudgetPlannedActionSchema,
  createGoalPlannedActionSchema,
  createRecurringPlannedActionSchema,
  createTransactionPlannedActionSchema,
]);

export const advisorActionProposalSchema = z.discriminatedUnion("kind", [
  createAccountPlannedActionSchema.extend({
    id: z.string().min(1),
    requiresConfirmation: z.boolean().default(true),
  }),
  createCategoryPlannedActionSchema.extend({
    id: z.string().min(1),
    requiresConfirmation: z.boolean().default(true),
  }),
  createBudgetPlannedActionSchema.extend({
    id: z.string().min(1),
    requiresConfirmation: z.boolean().default(true),
  }),
  createGoalPlannedActionSchema.extend({
    id: z.string().min(1),
    requiresConfirmation: z.boolean().default(true),
  }),
  createRecurringPlannedActionSchema.extend({
    id: z.string().min(1),
    requiresConfirmation: z.boolean().default(true),
  }),
  createTransactionPlannedActionSchema.extend({
    id: z.string().min(1),
    requiresConfirmation: z.boolean().default(true),
  }),
]);

export const advisorChatModelOutputSchema = z.object({
  reply: z
    .string()
    .trim()
    .min(1, "Reply is required")
    .max(6000, "Reply must be at most 6000 characters"),
  actions: z.array(advisorPlannedActionSchema).max(3).default([]),
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
  actions: z.array(advisorActionProposalSchema).max(3).default([]),
  model: z.string(),
  generatedAt: z.string().datetime(),
  contextStats: advisorContextStatsSchema,
});

export const advisorActionExecutionRequestSchema = z.object({
  action: advisorActionProposalSchema,
});

export const advisorEntityTypeEnum = z.enum([
  "account",
  "budget",
  "category",
  "goal",
  "recurring_rule",
  "transaction",
]);

export const advisorActionExecutionResultSchema = z.object({
  kind: advisorActionKindEnum,
  entityType: advisorEntityTypeEnum,
  entityId: z.string(),
  summary: z.string(),
});
