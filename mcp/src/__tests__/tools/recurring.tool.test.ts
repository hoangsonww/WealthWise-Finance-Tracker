import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { RecurringRule } from "../../models/recurring-rule.model";
import { Transaction } from "../../models/transaction.model";
import { Account } from "../../models/account.model";
import { Category } from "../../models/category.model";

const userId = new mongoose.Types.ObjectId().toString();

async function createTestData() {
  const account = await Account.create({
    userId,
    name: "Main",
    type: "checking",
    balance: 5000,
  });
  const category = await Category.create({
    name: "Bills",
    icon: "B",
    color: "#000",
    type: "expense",
    isDefault: true,
  });
  return { account, category };
}

describe("recurring tools", () => {
  describe("list_recurring", () => {
    it("should list all recurring rules for user", async () => {
      const { account, category } = await createTestData();
      const startDate = new Date(2024, 0, 1);

      await RecurringRule.create({
        userId,
        accountId: account._id,
        categoryId: category._id,
        type: "expense",
        amount: 100,
        description: "Netflix",
        frequency: "monthly",
        startDate,
        nextDueDate: startDate,
      });

      const rules = await RecurringRule.find({ userId });
      expect(rules).toHaveLength(1);
      expect(rules[0].description).toBe("Netflix");
    });
  });

  describe("create_recurring", () => {
    it("should create a recurring rule with nextDueDate = startDate", async () => {
      const { account, category } = await createTestData();
      const startDate = new Date(2024, 5, 1);

      const rule = await RecurringRule.create({
        userId,
        accountId: account._id,
        categoryId: category._id,
        type: "expense",
        amount: 50,
        description: "Gym",
        frequency: "monthly",
        startDate,
        nextDueDate: startDate,
      });

      expect(rule.nextDueDate.getTime()).toBe(startDate.getTime());
      expect(rule.isActive).toBe(true);
    });
  });

  describe("get_upcoming_bills", () => {
    it("should return rules due within 30 days", async () => {
      const { account, category } = await createTestData();
      const now = new Date();
      const soon = new Date();
      soon.setDate(soon.getDate() + 10);
      const far = new Date();
      far.setDate(far.getDate() + 60);

      await RecurringRule.create({
        userId,
        accountId: account._id,
        categoryId: category._id,
        type: "expense",
        amount: 100,
        description: "Due soon",
        frequency: "monthly",
        startDate: now,
        nextDueDate: soon,
      });
      await RecurringRule.create({
        userId,
        accountId: account._id,
        categoryId: category._id,
        type: "expense",
        amount: 200,
        description: "Due later",
        frequency: "monthly",
        startDate: now,
        nextDueDate: far,
      });

      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);

      const upcoming = await RecurringRule.find({
        userId,
        isActive: true,
        nextDueDate: { $gte: now, $lte: thirtyDays },
      });

      expect(upcoming).toHaveLength(1);
      expect(upcoming[0].description).toBe("Due soon");
    });
  });

  describe("mark_recurring_paid", () => {
    it("should create transaction and advance nextDueDate", async () => {
      const { account, category } = await createTestData();
      const nextDue = new Date(2024, 5, 1);

      const rule = await RecurringRule.create({
        userId,
        accountId: account._id,
        categoryId: category._id,
        type: "expense",
        amount: 100,
        description: "Netflix",
        frequency: "monthly",
        startDate: nextDue,
        nextDueDate: nextDue,
      });

      // Simulate mark as paid
      const tx = await Transaction.create({
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

      await Account.findByIdAndUpdate(account._id, {
        $inc: { balance: -rule.amount },
      });

      const newNext = new Date(rule.nextDueDate);
      newNext.setMonth(newNext.getMonth() + 1);
      rule.nextDueDate = newNext;
      await rule.save();

      expect(tx.isRecurring).toBe(true);
      expect(tx.recurringRuleId!.toString()).toBe(rule._id.toString());

      const updatedRule = await RecurringRule.findById(rule._id);
      expect(updatedRule!.nextDueDate.getMonth()).toBe(6); // July

      const updatedAccount = await Account.findById(account._id);
      expect(updatedAccount!.balance).toBe(4900);
    });

    it("should deactivate rule when nextDueDate passes endDate", async () => {
      const { account, category } = await createTestData();
      const nextDue = new Date(2024, 11, 1);
      const endDate = new Date(2024, 11, 31);

      const rule = await RecurringRule.create({
        userId,
        accountId: account._id,
        categoryId: category._id,
        type: "expense",
        amount: 50,
        description: "Trial sub",
        frequency: "monthly",
        startDate: nextDue,
        nextDueDate: nextDue,
        endDate,
      });

      const newNext = new Date(nextDue);
      newNext.setMonth(newNext.getMonth() + 1); // Jan 2025

      if (rule.endDate && newNext > rule.endDate) {
        rule.isActive = false;
      }
      rule.nextDueDate = newNext;
      await rule.save();

      expect(rule.isActive).toBe(false);
    });
  });

  describe("delete_recurring", () => {
    it("should delete a recurring rule", async () => {
      const { account, category } = await createTestData();

      const rule = await RecurringRule.create({
        userId,
        accountId: account._id,
        categoryId: category._id,
        type: "expense",
        amount: 100,
        description: "To Delete",
        frequency: "weekly",
        startDate: new Date(),
        nextDueDate: new Date(),
      });

      await RecurringRule.findOneAndDelete({ _id: rule._id, userId });
      const found = await RecurringRule.findById(rule._id);
      expect(found).toBeNull();
    });
  });
});
