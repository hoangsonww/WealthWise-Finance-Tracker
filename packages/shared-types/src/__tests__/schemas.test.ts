import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  accountTypeEnum,
  createAccountSchema,
  updateAccountSchema,
  transactionTypeEnum,
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
  categoryTypeEnum,
  createCategorySchema,
  updateCategorySchema,
  categoryManagementResponseSchema,
  budgetPeriodEnum,
  createBudgetSchema,
  updateBudgetSchema,
  createGoalSchema,
  updateGoalSchema,
  addFundsSchema,
  recurringTypeEnum,
  frequencyEnum,
  createRecurringSchema,
  updateRecurringSchema,
  advisorChatRequestSchema,
  advisorChatModelOutputSchema,
  advisorChatResponseSchema,
} from "..";

// ---------------------------------------------------------------------------
// Auth Schemas
// ---------------------------------------------------------------------------

describe("registerSchema", () => {
  const valid = {
    email: "Test@Example.com",
    name: "John Doe",
    password: "TestPass1",
  };

  it("accepts valid input", () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("lowercases and trims email", () => {
    const result = registerSchema.safeParse({
      ...valid,
      email: "  Test@Example.COM  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("trims name", () => {
    const result = registerSchema.safeParse({ ...valid, name: "  Jane  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jane");
    }
  });

  it("rejects missing email", () => {
    const { email: _, ...rest } = valid;
    expect(registerSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects name shorter than 2 characters", () => {
    expect(registerSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });

  it("rejects name longer than 50 characters", () => {
    expect(registerSchema.safeParse({ ...valid, name: "A".repeat(51) }).success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    expect(registerSchema.safeParse({ ...valid, password: "Short1A" }).success).toBe(false);
  });

  it("rejects password without uppercase letter", () => {
    expect(registerSchema.safeParse({ ...valid, password: "testpass1" }).success).toBe(false);
  });

  it("rejects password without lowercase letter", () => {
    expect(registerSchema.safeParse({ ...valid, password: "TESTPASS1" }).success).toBe(false);
  });

  it("rejects password without a number", () => {
    expect(registerSchema.safeParse({ ...valid, password: "TestPasss" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  const valid = { email: "user@example.com", password: "anything" };

  it("accepts valid input", () => {
    expect(loginSchema.safeParse(valid).success).toBe(true);
  });

  it("lowercases and trims email", () => {
    const result = loginSchema.safeParse({
      email: "  USER@Example.COM  ",
      password: "x",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects empty password", () => {
    expect(loginSchema.safeParse({ ...valid, password: "" }).success).toBe(false);
  });

  it("rejects missing email", () => {
    expect(loginSchema.safeParse({ password: "x" }).success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid name", () => {
    const result = updateProfileSchema.safeParse({ name: "Jane" });
    expect(result.success).toBe(true);
  });

  it("accepts valid currency and uppercases it", () => {
    const result = updateProfileSchema.safeParse({ currency: "eur" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("EUR");
    }
  });

  it("rejects name shorter than 2 characters", () => {
    expect(updateProfileSchema.safeParse({ name: "A" }).success).toBe(false);
  });

  it("rejects name longer than 50 characters", () => {
    expect(updateProfileSchema.safeParse({ name: "A".repeat(51) }).success).toBe(false);
  });

  it("rejects currency with wrong length", () => {
    expect(updateProfileSchema.safeParse({ currency: "US" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ currency: "USDX" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Account Schemas
// ---------------------------------------------------------------------------

describe("accountTypeEnum", () => {
  const validTypes = ["checking", "savings", "credit_card", "cash", "investment"] as const;

  it.each(validTypes)("accepts '%s'", (type) => {
    expect(accountTypeEnum.safeParse(type).success).toBe(true);
  });

  it("rejects invalid type", () => {
    expect(accountTypeEnum.safeParse("loan").success).toBe(false);
    expect(accountTypeEnum.safeParse("").success).toBe(false);
  });
});

describe("createAccountSchema", () => {
  const valid = { name: "My Checking", type: "checking" as const };

  it("accepts valid input and applies defaults", () => {
    const result = createAccountSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.balance).toBe(0);
      expect(result.data.currency).toBe("USD");
      expect(result.data.color).toBe("#6366f1");
    }
  });

  it("accepts explicit values overriding defaults", () => {
    const result = createAccountSchema.safeParse({
      ...valid,
      balance: 1000,
      currency: "eur",
      color: "#ff0000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.balance).toBe(1000);
      expect(result.data.currency).toBe("EUR");
      expect(result.data.color).toBe("#ff0000");
    }
  });

  it("rejects empty name", () => {
    expect(createAccountSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects name longer than 50 characters", () => {
    expect(createAccountSchema.safeParse({ ...valid, name: "A".repeat(51) }).success).toBe(false);
  });

  it("rejects invalid account type", () => {
    expect(createAccountSchema.safeParse({ ...valid, type: "loan" }).success).toBe(false);
  });

  it("rejects invalid hex color", () => {
    expect(createAccountSchema.safeParse({ ...valid, color: "red" }).success).toBe(false);
    expect(createAccountSchema.safeParse({ ...valid, color: "#gggggg" }).success).toBe(false);
  });

  it("rejects non-finite balance", () => {
    expect(createAccountSchema.safeParse({ ...valid, balance: Infinity }).success).toBe(false);
    expect(createAccountSchema.safeParse({ ...valid, balance: NaN }).success).toBe(false);
  });
});

describe("updateAccountSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateAccountSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid partial update", () => {
    const result = updateAccountSchema.safeParse({ name: "Renamed" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid values on optional fields", () => {
    expect(updateAccountSchema.safeParse({ name: "" }).success).toBe(false);
    expect(updateAccountSchema.safeParse({ type: "invalid" }).success).toBe(false);
    expect(updateAccountSchema.safeParse({ color: "bad" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Transaction Schemas
// ---------------------------------------------------------------------------

describe("transactionTypeEnum", () => {
  const validTypes = ["income", "expense", "transfer"] as const;

  it.each(validTypes)("accepts '%s'", (type) => {
    expect(transactionTypeEnum.safeParse(type).success).toBe(true);
  });

  it("rejects invalid type", () => {
    expect(transactionTypeEnum.safeParse("refund").success).toBe(false);
  });
});

describe("createTransactionSchema", () => {
  const valid = {
    accountId: "acc-123",
    type: "expense" as const,
    amount: 42.5,
    categoryId: "cat-456",
    description: "Grocery shopping",
    date: "2025-06-15T10:00:00.000Z",
  };

  it("accepts valid input with all required fields", () => {
    const result = createTransactionSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isRecurring).toBe(false);
      expect(result.data.tags).toEqual([]);
    }
  });

  it("accepts valid input with all optional fields", () => {
    const result = createTransactionSchema.safeParse({
      ...valid,
      subcategory: "Vegetables",
      notes: "Weekly run",
      isRecurring: true,
      tags: ["food", "weekly"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing accountId", () => {
    const { accountId: _, ...rest } = valid;
    expect(createTransactionSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing type", () => {
    const { type: _, ...rest } = valid;
    expect(createTransactionSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing categoryId", () => {
    const { categoryId: _, ...rest } = valid;
    expect(createTransactionSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing description", () => {
    const { description: _, ...rest } = valid;
    expect(createTransactionSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing date", () => {
    const { date: _, ...rest } = valid;
    expect(createTransactionSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects zero amount", () => {
    expect(createTransactionSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });

  it("rejects negative amount", () => {
    expect(createTransactionSchema.safeParse({ ...valid, amount: -10 }).success).toBe(false);
  });

  it("rejects non-finite amount", () => {
    expect(createTransactionSchema.safeParse({ ...valid, amount: Infinity }).success).toBe(false);
  });

  it("rejects description longer than 200 characters", () => {
    expect(
      createTransactionSchema.safeParse({
        ...valid,
        description: "A".repeat(201),
      }).success
    ).toBe(false);
  });

  it("rejects empty description", () => {
    expect(createTransactionSchema.safeParse({ ...valid, description: "" }).success).toBe(false);
  });

  it("rejects invalid date string", () => {
    expect(createTransactionSchema.safeParse({ ...valid, date: "not-a-date" }).success).toBe(false);
  });

  it("rejects more than 10 tags", () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
    expect(createTransactionSchema.safeParse({ ...valid, tags }).success).toBe(false);
  });

  it("rejects tags with empty strings", () => {
    expect(createTransactionSchema.safeParse({ ...valid, tags: [""] }).success).toBe(false);
  });

  it("rejects tag longer than 30 characters", () => {
    expect(
      createTransactionSchema.safeParse({
        ...valid,
        tags: ["A".repeat(31)],
      }).success
    ).toBe(false);
  });

  it("rejects notes longer than 500 characters", () => {
    expect(
      createTransactionSchema.safeParse({
        ...valid,
        notes: "A".repeat(501),
      }).success
    ).toBe(false);
  });

  it("rejects subcategory longer than 50 characters", () => {
    expect(
      createTransactionSchema.safeParse({
        ...valid,
        subcategory: "A".repeat(51),
      }).success
    ).toBe(false);
  });
});

describe("updateTransactionSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateTransactionSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid partial update", () => {
    const result = updateTransactionSchema.safeParse({
      amount: 100,
      description: "Updated",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid values on optional fields", () => {
    expect(updateTransactionSchema.safeParse({ amount: -5 }).success).toBe(false);
  });
});

describe("transactionQuerySchema", () => {
  it("accepts empty object and applies all defaults", () => {
    const result = transactionQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortBy).toBe("date");
      expect(result.data.sortOrder).toBe("desc");
    }
  });

  it("coerces string numbers for page and limit", () => {
    const result = transactionQuerySchema.safeParse({
      page: "3",
      limit: "50",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it("coerces string numbers for minAmount and maxAmount", () => {
    const result = transactionQuerySchema.safeParse({
      minAmount: "10",
      maxAmount: "500",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minAmount).toBe(10);
      expect(result.data.maxAmount).toBe(500);
    }
  });

  it("accepts valid optional filters", () => {
    const result = transactionQuerySchema.safeParse({
      accountId: "acc-1",
      categoryId: "cat-1",
      type: "income",
      startDate: "2025-01-01T00:00:00.000Z",
      endDate: "2025-12-31T23:59:59.999Z",
      search: "groceries",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid sortBy value", () => {
    expect(transactionQuerySchema.safeParse({ sortBy: "invalid" }).success).toBe(false);
  });

  it("rejects invalid sortOrder value", () => {
    expect(transactionQuerySchema.safeParse({ sortOrder: "random" }).success).toBe(false);
  });

  it("rejects negative minAmount", () => {
    expect(transactionQuerySchema.safeParse({ minAmount: -1 }).success).toBe(false);
  });

  it("rejects limit exceeding 100", () => {
    expect(transactionQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  it("rejects non-positive page", () => {
    expect(transactionQuerySchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it("rejects search longer than 100 characters", () => {
    expect(transactionQuerySchema.safeParse({ search: "A".repeat(101) }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Category Schemas
// ---------------------------------------------------------------------------

describe("categoryTypeEnum", () => {
  it("accepts 'income'", () => {
    expect(categoryTypeEnum.safeParse("income").success).toBe(true);
  });

  it("accepts 'expense'", () => {
    expect(categoryTypeEnum.safeParse("expense").success).toBe(true);
  });

  it("rejects invalid type", () => {
    expect(categoryTypeEnum.safeParse("transfer").success).toBe(false);
    expect(categoryTypeEnum.safeParse("").success).toBe(false);
  });
});

describe("createCategorySchema", () => {
  const valid = {
    name: "Food",
    icon: "utensils",
    color: "#ef4444",
    type: "expense" as const,
  };

  it("accepts valid input", () => {
    expect(createCategorySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(createCategorySchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects name longer than 30 characters", () => {
    expect(createCategorySchema.safeParse({ ...valid, name: "A".repeat(31) }).success).toBe(false);
  });

  it("rejects empty icon", () => {
    expect(createCategorySchema.safeParse({ ...valid, icon: "" }).success).toBe(false);
  });

  it("rejects icon longer than 10 characters", () => {
    expect(createCategorySchema.safeParse({ ...valid, icon: "A".repeat(11) }).success).toBe(false);
  });

  it("rejects invalid hex color", () => {
    expect(createCategorySchema.safeParse({ ...valid, color: "red" }).success).toBe(false);
    expect(createCategorySchema.safeParse({ ...valid, color: "#xyz" }).success).toBe(false);
  });

  it("rejects invalid category type", () => {
    expect(createCategorySchema.safeParse({ ...valid, type: "transfer" }).success).toBe(false);
  });
});

describe("updateCategorySchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateCategorySchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid partial update", () => {
    const result = updateCategorySchema.safeParse({ name: "Dining" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid values on optional fields", () => {
    expect(updateCategorySchema.safeParse({ color: "bad" }).success).toBe(false);
  });
});

describe("categoryManagementResponseSchema", () => {
  const valid = {
    id: "cat-123",
    userId: "user-123",
    name: "Groceries",
    icon: "🛒",
    color: "#10b981",
    type: "expense" as const,
    isDefault: false,
    createdAt: "2025-06-15T10:00:00.000Z",
    usage: {
      transactionCount: 14,
      budgetCount: 1,
      activeBudgetCount: 1,
      recurringCount: 2,
      activeRecurringCount: 1,
      spentThisMonth: 312.55,
      lastTransactionAt: "2025-06-20T10:00:00.000Z",
      canDelete: false,
    },
    linkedBudgets: [
      {
        id: "budget-1",
        amount: 500,
        period: "monthly" as const,
        alertThreshold: 0.8,
        isActive: true,
      },
    ],
    linkedRecurringRules: [
      {
        id: "rule-1",
        description: "Weekly meal plan",
        amount: 85,
        frequency: "weekly" as const,
        nextDueDate: "2025-06-22T10:00:00.000Z",
        isActive: true,
        type: "expense" as const,
      },
    ],
    deleteBlockers: ["This category is linked to 14 transactions."],
  };

  it("accepts a rich category management payload", () => {
    expect(categoryManagementResponseSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects negative usage counts", () => {
    expect(
      categoryManagementResponseSchema.safeParse({
        ...valid,
        usage: {
          ...valid.usage,
          transactionCount: -1,
        },
      }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Budget Schemas
// ---------------------------------------------------------------------------

describe("budgetPeriodEnum", () => {
  it("accepts 'monthly'", () => {
    expect(budgetPeriodEnum.safeParse("monthly").success).toBe(true);
  });

  it("accepts 'weekly'", () => {
    expect(budgetPeriodEnum.safeParse("weekly").success).toBe(true);
  });

  it("rejects invalid period", () => {
    expect(budgetPeriodEnum.safeParse("yearly").success).toBe(false);
  });
});

describe("createBudgetSchema", () => {
  const valid = {
    categoryId: "cat-123",
    amount: 500,
    period: "monthly" as const,
  };

  it("accepts valid input and applies default alertThreshold", () => {
    const result = createBudgetSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.alertThreshold).toBe(0.8);
    }
  });

  it("accepts explicit alertThreshold", () => {
    const result = createBudgetSchema.safeParse({
      ...valid,
      alertThreshold: 0.5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.alertThreshold).toBe(0.5);
    }
  });

  it("rejects negative amount", () => {
    expect(createBudgetSchema.safeParse({ ...valid, amount: -100 }).success).toBe(false);
  });

  it("rejects zero amount", () => {
    expect(createBudgetSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });

  it("rejects non-finite amount", () => {
    expect(createBudgetSchema.safeParse({ ...valid, amount: Infinity }).success).toBe(false);
  });

  it("rejects invalid period", () => {
    expect(createBudgetSchema.safeParse({ ...valid, period: "yearly" }).success).toBe(false);
  });

  it("rejects alertThreshold below 0", () => {
    expect(createBudgetSchema.safeParse({ ...valid, alertThreshold: -0.1 }).success).toBe(false);
  });

  it("rejects alertThreshold above 1", () => {
    expect(createBudgetSchema.safeParse({ ...valid, alertThreshold: 1.1 }).success).toBe(false);
  });

  it("accepts alertThreshold at boundaries (0 and 1)", () => {
    expect(createBudgetSchema.safeParse({ ...valid, alertThreshold: 0 }).success).toBe(true);
    expect(createBudgetSchema.safeParse({ ...valid, alertThreshold: 1 }).success).toBe(true);
  });

  it("rejects missing categoryId", () => {
    const { categoryId: _, ...rest } = valid;
    expect(createBudgetSchema.safeParse(rest).success).toBe(false);
  });
});

describe("updateBudgetSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateBudgetSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid partial update", () => {
    const result = updateBudgetSchema.safeParse({ amount: 750 });
    expect(result.success).toBe(true);
  });

  it("rejects invalid values on optional fields", () => {
    expect(updateBudgetSchema.safeParse({ amount: -10 }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Goal Schemas
// ---------------------------------------------------------------------------

describe("createGoalSchema", () => {
  const valid = {
    name: "Emergency Fund",
    targetAmount: 10000,
  };

  it("accepts valid input and applies defaults", () => {
    const result = createGoalSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentAmount).toBe(0);
      expect(result.data.color).toBe("#10b981");
      expect(result.data.icon).toBe("\u{1F3AF}");
    }
  });

  it("accepts all fields with explicit values", () => {
    const result = createGoalSchema.safeParse({
      ...valid,
      currentAmount: 2500,
      deadline: "2026-12-31T00:00:00.000Z",
      color: "#3b82f6",
      icon: "house",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const { name: _, ...rest } = valid;
    expect(createGoalSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects empty name", () => {
    expect(createGoalSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects name longer than 50 characters", () => {
    expect(createGoalSchema.safeParse({ ...valid, name: "A".repeat(51) }).success).toBe(false);
  });

  it("rejects missing targetAmount", () => {
    const { targetAmount: _, ...rest } = valid;
    expect(createGoalSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects zero targetAmount", () => {
    expect(createGoalSchema.safeParse({ ...valid, targetAmount: 0 }).success).toBe(false);
  });

  it("rejects negative targetAmount", () => {
    expect(createGoalSchema.safeParse({ ...valid, targetAmount: -500 }).success).toBe(false);
  });

  it("rejects negative currentAmount", () => {
    expect(createGoalSchema.safeParse({ ...valid, currentAmount: -1 }).success).toBe(false);
  });

  it("rejects non-finite targetAmount", () => {
    expect(createGoalSchema.safeParse({ ...valid, targetAmount: Infinity }).success).toBe(false);
  });

  it("rejects invalid deadline string", () => {
    expect(createGoalSchema.safeParse({ ...valid, deadline: "not-a-date" }).success).toBe(false);
  });

  it("rejects invalid hex color", () => {
    expect(createGoalSchema.safeParse({ ...valid, color: "green" }).success).toBe(false);
  });
});

describe("updateGoalSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateGoalSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid partial update", () => {
    const result = updateGoalSchema.safeParse({
      name: "New Goal Name",
      targetAmount: 20000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid values on optional fields", () => {
    expect(updateGoalSchema.safeParse({ targetAmount: -1 }).success).toBe(false);
  });
});

describe("addFundsSchema", () => {
  it("accepts positive amount", () => {
    const result = addFundsSchema.safeParse({ amount: 100 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(100);
    }
  });

  it("accepts small positive amount", () => {
    expect(addFundsSchema.safeParse({ amount: 0.01 }).success).toBe(true);
  });

  it("rejects zero", () => {
    expect(addFundsSchema.safeParse({ amount: 0 }).success).toBe(false);
  });

  it("rejects negative amount", () => {
    expect(addFundsSchema.safeParse({ amount: -50 }).success).toBe(false);
  });

  it("rejects Infinity", () => {
    expect(addFundsSchema.safeParse({ amount: Infinity }).success).toBe(false);
  });

  it("rejects NaN", () => {
    expect(addFundsSchema.safeParse({ amount: NaN }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Recurring Schemas
// ---------------------------------------------------------------------------

describe("recurringTypeEnum", () => {
  it("accepts 'income'", () => {
    expect(recurringTypeEnum.safeParse("income").success).toBe(true);
  });

  it("accepts 'expense'", () => {
    expect(recurringTypeEnum.safeParse("expense").success).toBe(true);
  });

  it("rejects invalid type", () => {
    expect(recurringTypeEnum.safeParse("transfer").success).toBe(false);
  });
});

describe("frequencyEnum", () => {
  const validFrequencies = ["daily", "weekly", "biweekly", "monthly", "yearly"] as const;

  it.each(validFrequencies)("accepts '%s'", (freq) => {
    expect(frequencyEnum.safeParse(freq).success).toBe(true);
  });

  it("rejects invalid frequency", () => {
    expect(frequencyEnum.safeParse("quarterly").success).toBe(false);
    expect(frequencyEnum.safeParse("").success).toBe(false);
  });
});

describe("createRecurringSchema", () => {
  const valid = {
    accountId: "acc-123",
    categoryId: "cat-456",
    type: "expense" as const,
    amount: 15.99,
    description: "Netflix subscription",
    frequency: "monthly" as const,
    startDate: "2025-01-01T00:00:00.000Z",
  };

  it("accepts valid input with all required fields", () => {
    expect(createRecurringSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts valid input with optional endDate", () => {
    const result = createRecurringSchema.safeParse({
      ...valid,
      endDate: "2026-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing accountId", () => {
    const { accountId: _, ...rest } = valid;
    expect(createRecurringSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing categoryId", () => {
    const { categoryId: _, ...rest } = valid;
    expect(createRecurringSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing type", () => {
    const { type: _, ...rest } = valid;
    expect(createRecurringSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing amount", () => {
    const { amount: _, ...rest } = valid;
    expect(createRecurringSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing description", () => {
    const { description: _, ...rest } = valid;
    expect(createRecurringSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing frequency", () => {
    const { frequency: _, ...rest } = valid;
    expect(createRecurringSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing startDate", () => {
    const { startDate: _, ...rest } = valid;
    expect(createRecurringSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects zero amount", () => {
    expect(createRecurringSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });

  it("rejects negative amount", () => {
    expect(createRecurringSchema.safeParse({ ...valid, amount: -10 }).success).toBe(false);
  });

  it("rejects non-finite amount", () => {
    expect(createRecurringSchema.safeParse({ ...valid, amount: Infinity }).success).toBe(false);
  });

  it("rejects invalid frequency", () => {
    expect(createRecurringSchema.safeParse({ ...valid, frequency: "quarterly" }).success).toBe(
      false
    );
  });

  it("rejects invalid startDate", () => {
    expect(createRecurringSchema.safeParse({ ...valid, startDate: "bad-date" }).success).toBe(
      false
    );
  });

  it("rejects invalid endDate", () => {
    expect(createRecurringSchema.safeParse({ ...valid, endDate: "bad-date" }).success).toBe(false);
  });

  it("rejects empty description", () => {
    expect(createRecurringSchema.safeParse({ ...valid, description: "" }).success).toBe(false);
  });

  it("rejects description longer than 200 characters", () => {
    expect(
      createRecurringSchema.safeParse({
        ...valid,
        description: "A".repeat(201),
      }).success
    ).toBe(false);
  });
});

describe("updateRecurringSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateRecurringSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid partial update", () => {
    const result = updateRecurringSchema.safeParse({
      amount: 19.99,
      description: "Updated subscription",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid values on optional fields", () => {
    expect(updateRecurringSchema.safeParse({ amount: -5 }).success).toBe(false);
    expect(updateRecurringSchema.safeParse({ frequency: "quarterly" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Advisor Schemas
// ---------------------------------------------------------------------------

describe("advisorChatRequestSchema", () => {
  it("accepts a valid message with optional history", () => {
    const result = advisorChatRequestSchema.safeParse({
      message: "What should I cut back on this month?",
      history: [
        {
          role: "user",
          content: "How did I do last month?",
        },
        {
          role: "assistant",
          content: "Your spending was 8% lower than the previous month.",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("defaults history to an empty array", () => {
    const result = advisorChatRequestSchema.safeParse({
      message: "Summarize my subscriptions.",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.history).toEqual([]);
    }
  });

  it("rejects empty messages", () => {
    expect(advisorChatRequestSchema.safeParse({ message: "   " }).success).toBe(false);
  });

  it("rejects invalid history roles", () => {
    expect(
      advisorChatRequestSchema.safeParse({
        message: "Hello",
        history: [{ role: "model", content: "Nope" }],
      }).success
    ).toBe(false);
  });
});

describe("advisorChatResponseSchema", () => {
  it("accepts a valid advisor response payload", () => {
    const result = advisorChatResponseSchema.safeParse({
      reply: "Your dining spend is trending above your monthly average.",
      model: "gemini-2.5-flash",
      generatedAt: "2026-03-07T12:00:00.000Z",
      contextStats: {
        accountCount: 3,
        transactionCount: 142,
        categoryCount: 18,
        budgetCount: 5,
        goalCount: 2,
        recurringCount: 4,
        netWorth: 18250.45,
        totalAssets: 21450.45,
        totalDebt: 3200,
        incomeThisMonth: 6200,
        spendingThisMonth: 3880,
        savingsThisMonth: 2320,
        savingsRate: 37.42,
        upcomingBills30Days: 3,
        currency: "USD",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid currencies", () => {
    expect(
      advisorChatResponseSchema.safeParse({
        reply: "test",
        model: "gemini-2.5-flash",
        generatedAt: "2026-03-07T12:00:00.000Z",
        contextStats: {
          accountCount: 1,
          transactionCount: 1,
          categoryCount: 1,
          budgetCount: 1,
          goalCount: 1,
          recurringCount: 1,
          netWorth: 1,
          totalAssets: 1,
          totalDebt: 0,
          incomeThisMonth: 1,
          spendingThisMonth: 1,
          savingsThisMonth: 0,
          savingsRate: 0,
          upcomingBills30Days: 0,
          currency: "US",
        },
      }).success
    ).toBe(false);
  });
});

describe("advisorChatModelOutputSchema", () => {
  it("accepts a valid reply-only model payload", () => {
    const result = advisorChatModelOutputSchema.safeParse({
      reply:
        "1. Go to Transactions. 2. Click Add Transaction. 3. Fill in the amount, category, and date. 4. Save it.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty reply", () => {
    expect(
      advisorChatModelOutputSchema.safeParse({
        reply: "   ",
      }).success
    ).toBe(false);
  });
});
