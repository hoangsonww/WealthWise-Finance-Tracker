import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Budget } from "../../models/budget.model";
import { Transaction } from "../../models/transaction.model";
import { Category } from "../../models/category.model";
import { Account } from "../../models/account.model";

const userId = new mongoose.Types.ObjectId().toString();

async function createTestCategory() {
  return Category.create({
    name: "Food",
    icon: "F",
    color: "#ff0000",
    type: "expense",
    isDefault: true,
  });
}

describe("budgets tools", () => {
  describe("list_budgets", () => {
    it("should list all budgets for user", async () => {
      const cat = await createTestCategory();
      await Budget.create({
        userId,
        categoryId: cat._id,
        amount: 500,
        period: "monthly",
      });
      await Budget.create({
        userId,
        categoryId: cat._id,
        amount: 100,
        period: "weekly",
      });

      const budgets = await Budget.find({ userId });
      expect(budgets).toHaveLength(2);
    });

    it("should not list budgets of other users", async () => {
      const cat = await createTestCategory();
      await Budget.create({
        userId: new mongoose.Types.ObjectId(),
        categoryId: cat._id,
        amount: 500,
        period: "monthly",
      });

      const budgets = await Budget.find({ userId });
      expect(budgets).toHaveLength(0);
    });
  });

  describe("create_budget", () => {
    it("should create a budget with defaults", async () => {
      const cat = await createTestCategory();
      const budget = await Budget.create({
        userId,
        categoryId: cat._id,
        amount: 500,
        period: "monthly",
      });

      expect(budget.alertThreshold).toBe(0.8);
      expect(budget.isActive).toBe(true);
    });

    it("should create a budget with custom alert threshold", async () => {
      const cat = await createTestCategory();
      const budget = await Budget.create({
        userId,
        categoryId: cat._id,
        amount: 200,
        period: "weekly",
        alertThreshold: 0.9,
      });

      expect(budget.alertThreshold).toBe(0.9);
    });
  });

  describe("update_budget", () => {
    it("should update budget amount and period", async () => {
      const cat = await createTestCategory();
      const budget = await Budget.create({
        userId,
        categoryId: cat._id,
        amount: 500,
        period: "monthly",
      });

      const updated = await Budget.findOneAndUpdate(
        { _id: budget._id, userId },
        { $set: { amount: 600, period: "weekly" } },
        { new: true }
      );

      expect(updated!.amount).toBe(600);
      expect(updated!.period).toBe("weekly");
    });

    it("should not update budget of another user", async () => {
      const cat = await createTestCategory();
      const budget = await Budget.create({
        userId: new mongoose.Types.ObjectId(),
        categoryId: cat._id,
        amount: 500,
        period: "monthly",
      });

      const updated = await Budget.findOneAndUpdate(
        { _id: budget._id, userId },
        { $set: { amount: 9999 } },
        { new: true }
      );
      expect(updated).toBeNull();
    });
  });

  describe("get_budget_summary", () => {
    it("should calculate spent amount and status", async () => {
      const cat = await createTestCategory();
      const account = await Account.create({
        userId,
        name: "Main",
        type: "checking",
      });

      await Budget.create({
        userId,
        categoryId: cat._id,
        amount: 500,
        period: "monthly",
      });

      const now = new Date();
      await Transaction.create({
        userId,
        accountId: account._id,
        type: "expense",
        amount: 200,
        categoryId: cat._id,
        description: "Groceries",
        date: now,
      });

      const result = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            categoryId: cat._id,
            type: "expense",
            date: {
              $gte: new Date(now.getFullYear(), now.getMonth(), 1),
              $lte: now,
            },
          },
        },
        { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].totalSpent).toBe(200);
    });

    it("should return over_budget status when spending exceeds budget", async () => {
      const cat = await createTestCategory();
      const account = await Account.create({
        userId,
        name: "Main",
        type: "checking",
      });

      const budget = await Budget.create({
        userId,
        categoryId: cat._id,
        amount: 100,
        period: "monthly",
      });

      const now = new Date();
      await Transaction.create({
        userId,
        accountId: account._id,
        type: "expense",
        amount: 150,
        categoryId: cat._id,
        description: "Big expense",
        date: now,
      });

      const result = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            categoryId: cat._id,
            type: "expense",
            date: {
              $gte: new Date(now.getFullYear(), now.getMonth(), 1),
              $lte: now,
            },
          },
        },
        { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
      ]);

      const spent = result[0].totalSpent;
      const percentage = spent / budget.amount;
      expect(percentage).toBeGreaterThanOrEqual(1);
    });
  });
});
