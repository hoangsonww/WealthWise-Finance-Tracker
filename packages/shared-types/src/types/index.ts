import { z } from "zod";

import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  userResponseSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/user.schema";

import {
  createAccountSchema,
  updateAccountSchema,
  accountResponseSchema,
} from "../schemas/account.schema";

import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
  transactionResponseSchema,
} from "../schemas/transaction.schema";

import {
  createCategorySchema,
  updateCategorySchema,
  categoryResponseSchema,
  categoryUsageSchema,
  categoryLinkedBudgetSchema,
  categoryLinkedRecurringRuleSchema,
  categoryManagementResponseSchema,
} from "../schemas/category.schema";

import {
  createBudgetSchema,
  updateBudgetSchema,
  budgetResponseSchema,
  budgetSummarySchema,
} from "../schemas/budget.schema";

import {
  createGoalSchema,
  updateGoalSchema,
  addFundsSchema,
  goalResponseSchema,
} from "../schemas/goal.schema";

import {
  createRecurringSchema,
  updateRecurringSchema,
  recurringResponseSchema,
} from "../schemas/recurring.schema";

import {
  advisorChatRoleEnum,
  advisorChatHistoryItemSchema,
  advisorChatRequestSchema,
  advisorChatModelOutputSchema,
  advisorContextStatsSchema,
  advisorChatResponseSchema,
} from "../schemas/advisor.schema";

// ---------------------------------------------------------------------------
// User types
// ---------------------------------------------------------------------------
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ---------------------------------------------------------------------------
// Account types
// ---------------------------------------------------------------------------
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type AccountResponse = z.infer<typeof accountResponseSchema>;

// ---------------------------------------------------------------------------
// Transaction types
// ---------------------------------------------------------------------------
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
export type TransactionResponse = z.infer<typeof transactionResponseSchema>;

// ---------------------------------------------------------------------------
// Category types
// ---------------------------------------------------------------------------
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
export type CategoryUsage = z.infer<typeof categoryUsageSchema>;
export type CategoryLinkedBudget = z.infer<typeof categoryLinkedBudgetSchema>;
export type CategoryLinkedRecurringRule = z.infer<typeof categoryLinkedRecurringRuleSchema>;
export type CategoryManagementResponse = z.infer<typeof categoryManagementResponseSchema>;

// ---------------------------------------------------------------------------
// Budget types
// ---------------------------------------------------------------------------
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetResponse = z.infer<typeof budgetResponseSchema>;
export type BudgetSummary = z.infer<typeof budgetSummarySchema>;

// ---------------------------------------------------------------------------
// Goal types
// ---------------------------------------------------------------------------
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type AddFundsInput = z.infer<typeof addFundsSchema>;
export type GoalResponse = z.infer<typeof goalResponseSchema>;

// ---------------------------------------------------------------------------
// Recurring types
// ---------------------------------------------------------------------------
export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
export type RecurringResponse = z.infer<typeof recurringResponseSchema>;

// ---------------------------------------------------------------------------
// Advisor types
// ---------------------------------------------------------------------------
export type AdvisorChatRole = z.infer<typeof advisorChatRoleEnum>;
export type AdvisorChatHistoryItem = z.infer<typeof advisorChatHistoryItemSchema>;
export type AdvisorChatRequest = z.infer<typeof advisorChatRequestSchema>;
export type AdvisorChatModelOutput = z.infer<typeof advisorChatModelOutputSchema>;
export type AdvisorContextStats = z.infer<typeof advisorContextStatsSchema>;
export type AdvisorChatResponse = z.infer<typeof advisorChatResponseSchema>;

// ---------------------------------------------------------------------------
// Generic API response wrappers
// ---------------------------------------------------------------------------

/**
 * Standard success response wrapping a single resource.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Paginated success response wrapping a list of resources.
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Standard error response returned when a request fails.
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
