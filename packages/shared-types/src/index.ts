// ---------------------------------------------------------------------------
// Schema exports
// ---------------------------------------------------------------------------
export {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  userResponseSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./schemas/user.schema";

export {
  accountTypeEnum,
  createAccountSchema,
  updateAccountSchema,
  accountResponseSchema,
} from "./schemas/account.schema";

export {
  transactionTypeEnum,
  transactionSortByEnum,
  sortOrderEnum,
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
  transactionResponseSchema,
} from "./schemas/transaction.schema";

export {
  categoryTypeEnum,
  createCategorySchema,
  updateCategorySchema,
  categoryResponseSchema,
  categoryUsageSchema,
  categoryLinkedBudgetSchema,
  categoryLinkedRecurringRuleSchema,
  categoryManagementResponseSchema,
} from "./schemas/category.schema";

export {
  budgetPeriodEnum,
  budgetStatusEnum,
  createBudgetSchema,
  updateBudgetSchema,
  budgetResponseSchema,
  budgetSummarySchema,
} from "./schemas/budget.schema";

export {
  createGoalSchema,
  updateGoalSchema,
  addFundsSchema,
  goalResponseSchema,
} from "./schemas/goal.schema";

export {
  recurringTypeEnum,
  frequencyEnum,
  createRecurringSchema,
  updateRecurringSchema,
  recurringResponseSchema,
} from "./schemas/recurring.schema";

export {
  advisorChatRoleEnum,
  advisorChatHistoryItemSchema,
  advisorChatRequestSchema,
  advisorChatModelOutputSchema,
  advisorContextStatsSchema,
  advisorChatResponseSchema,
} from "./schemas/advisor.schema";

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------
export type {
  // User
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  UserResponse,
  ForgotPasswordInput,
  ResetPasswordInput,
  // Account
  CreateAccountInput,
  UpdateAccountInput,
  AccountResponse,
  // Transaction
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionQuery,
  TransactionResponse,
  // Category
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryResponse,
  CategoryUsage,
  CategoryLinkedBudget,
  CategoryLinkedRecurringRule,
  CategoryManagementResponse,
  // Budget
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetResponse,
  BudgetSummary,
  // Goal
  CreateGoalInput,
  UpdateGoalInput,
  AddFundsInput,
  GoalResponse,
  // Recurring
  CreateRecurringInput,
  UpdateRecurringInput,
  RecurringResponse,
  // Advisor
  AdvisorChatRole,
  AdvisorChatHistoryItem,
  AdvisorChatRequest,
  AdvisorChatModelOutput,
  AdvisorContextStats,
  AdvisorChatResponse,
  // API wrappers
  ApiResponse,
  PaginatedResponse,
  ApiError,
} from "./types/index";
