import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { Account } from "../models/account.model";
import { Budget } from "../models/budget.model";
import { Category } from "../models/category.model";
import { RecurringRule } from "../models/recurring-rule.model";
import { Transaction } from "../models/transaction.model";
import { ApiError } from "../utils/api-error";
import * as categoryService from "../services/category.service";

function userId() {
  return new mongoose.Types.ObjectId();
}

describe("category.service", () => {
  it("returns enriched category management data", async () => {
    const uid = userId();
    const checkingId = new mongoose.Types.ObjectId();
    const customCategoryId = new mongoose.Types.ObjectId();
    const defaultCategoryId = new mongoose.Types.ObjectId();
    const now = new Date();

    await Account.create({
      _id: checkingId,
      userId: uid,
      name: "Primary Checking",
      type: "checking",
      balance: 2400,
      currency: "USD",
      color: "#6366f1",
    });

    await Category.create([
      {
        _id: defaultCategoryId,
        userId: null,
        name: "Salary",
        icon: "salary",
        color: "#10b981",
        type: "income",
        isDefault: true,
      },
      {
        _id: customCategoryId,
        userId: uid,
        name: "Groceries",
        icon: "cart",
        color: "#14b8a6",
        type: "expense",
        isDefault: false,
      },
    ]);

    await Budget.create({
      userId: uid,
      categoryId: customCategoryId,
      amount: 600,
      period: "monthly",
      alertThreshold: 0.8,
      isActive: true,
    });

    await RecurringRule.create({
      userId: uid,
      accountId: checkingId,
      categoryId: customCategoryId,
      type: "expense",
      amount: 95,
      description: "Weekly grocery order",
      frequency: "weekly",
      startDate: now,
      nextDueDate: now,
      isActive: true,
    });

    await Transaction.create([
      {
        userId: uid,
        accountId: checkingId,
        type: "expense",
        amount: 125,
        currency: "USD",
        categoryId: customCategoryId,
        description: "Market run",
        date: now,
        isRecurring: false,
        tags: [],
      },
      {
        userId: uid,
        accountId: checkingId,
        type: "income",
        amount: 3000,
        currency: "USD",
        categoryId: defaultCategoryId,
        description: "Paycheck",
        date: now,
        isRecurring: false,
        tags: [],
      },
    ]);

    const result = await categoryService.list(uid.toString());

    const groceries = result.find((category) => category.id === customCategoryId.toString());
    const salary = result.find((category) => category.id === defaultCategoryId.toString());

    expect(groceries).toMatchObject({
      name: "Groceries",
      usage: {
        transactionCount: 1,
        budgetCount: 1,
        activeBudgetCount: 1,
        recurringCount: 1,
        activeRecurringCount: 1,
        spentThisMonth: 125,
        canDelete: false,
      },
    });
    expect(groceries?.linkedBudgets).toHaveLength(1);
    expect(groceries?.linkedRecurringRules).toHaveLength(1);
    expect(groceries?.deleteBlockers).toEqual([
      "Linked to 1 transaction.",
      "Used by 1 budget.",
      "Used by 1 recurring rule.",
    ]);

    expect(salary).toMatchObject({
      isDefault: true,
      usage: {
        transactionCount: 1,
        canDelete: false,
      },
    });
    expect(salary?.deleteBlockers).toContain("Built-in categories cannot be deleted.");
  });

  it("deletes an unused custom category", async () => {
    const uid = userId();
    const category = await Category.create({
      userId: uid,
      name: "Hobbies",
      icon: "art",
      color: "#8b5cf6",
      type: "expense",
      isDefault: false,
    });

    const result = await categoryService.remove(uid.toString(), category._id.toString());

    expect(result.id).toBe(category._id.toString());
    expect(await Category.findById(category._id)).toBeNull();
  });

  it("blocks deleting a category that is still linked", async () => {
    const uid = userId();
    const checkingId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    await Account.create({
      _id: checkingId,
      userId: uid,
      name: "Checking",
      type: "checking",
      balance: 1500,
      currency: "USD",
      color: "#6366f1",
    });

    await Category.create({
      _id: categoryId,
      userId: uid,
      name: "Dining",
      icon: "meal",
      color: "#f97316",
      type: "expense",
      isDefault: false,
    });

    await Transaction.create({
      userId: uid,
      accountId: checkingId,
      type: "expense",
      amount: 42,
      currency: "USD",
      categoryId,
      description: "Dinner out",
      date: new Date(),
      isRecurring: false,
      tags: [],
    });

    try {
      await categoryService.remove(uid.toString(), categoryId.toString());
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).statusCode).toBe(409);
      expect((error as ApiError).details).toMatchObject({
        categoryId: categoryId.toString(),
        usage: {
          transactionCount: 1,
        },
      });
    }
  });
});
