import { z } from "zod";
import { budgetPeriodEnum } from "./budget.schema";
import { frequencyEnum, recurringTypeEnum } from "./recurring.schema";

/**
 * Category applies to either income or expense transactions.
 */
export const categoryTypeEnum = z.enum(["income", "expense"]);

/**
 * Hex color validator.
 */
const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Schema for creating a new category.
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(30, "Category name must be at most 30 characters"),
  icon: z.string().trim().min(1, "Icon is required").max(10, "Icon must be at most 10 characters"),
  color: z.string().regex(hexColorRegex, "Color must be a valid hex color (e.g. #ef4444)"),
  type: categoryTypeEnum,
});

/**
 * Schema for updating an existing category. All fields are optional.
 */
export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(30, "Category name must be at most 30 characters")
    .optional(),
  icon: z
    .string()
    .trim()
    .min(1, "Icon is required")
    .max(10, "Icon must be at most 10 characters")
    .optional(),
  color: z
    .string()
    .regex(hexColorRegex, "Color must be a valid hex color (e.g. #ef4444)")
    .optional(),
  type: categoryTypeEnum.optional(),
});

/**
 * Schema representing the category object returned from the API.
 */
export const categoryResponseSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  type: categoryTypeEnum,
  isDefault: z.boolean(),
  createdAt: z.string().datetime(),
});

/**
 * Computed usage data for a category in the management experience.
 */
export const categoryUsageSchema = z.object({
  transactionCount: z.number().int().nonnegative(),
  budgetCount: z.number().int().nonnegative(),
  activeBudgetCount: z.number().int().nonnegative(),
  recurringCount: z.number().int().nonnegative(),
  activeRecurringCount: z.number().int().nonnegative(),
  spentThisMonth: z.number().nonnegative(),
  lastTransactionAt: z.string().datetime().nullable(),
  canDelete: z.boolean(),
});

/**
 * Budget records linked to a category.
 */
export const categoryLinkedBudgetSchema = z.object({
  id: z.string(),
  amount: z.number().nonnegative(),
  period: budgetPeriodEnum,
  alertThreshold: z.number(),
  isActive: z.boolean(),
});

/**
 * Recurring rules linked to a category.
 */
export const categoryLinkedRecurringRuleSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: z.number().nonnegative(),
  frequency: frequencyEnum,
  nextDueDate: z.string().datetime(),
  isActive: z.boolean(),
  type: recurringTypeEnum,
});

/**
 * Rich category shape used by the dashboard categories page.
 */
export const categoryManagementResponseSchema = categoryResponseSchema.extend({
  usage: categoryUsageSchema,
  linkedBudgets: z.array(categoryLinkedBudgetSchema),
  linkedRecurringRules: z.array(categoryLinkedRecurringRuleSchema),
  deleteBlockers: z.array(z.string()),
});
