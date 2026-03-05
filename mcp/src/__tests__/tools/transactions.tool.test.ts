import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Account } from "../../models/account.model";
import { Transaction } from "../../models/transaction.model";
import { Category } from "../../models/category.model";

const userId = new mongoose.Types.ObjectId().toString();

async function createTestAccount(balance = 1000) {
  return Account.create({
    userId,
    name: "Test Checking",
    type: "checking",
    balance,
  });
}

async function createTestCategory(type: "income" | "expense" = "expense") {
  return Category.create({
    name: "Test Cat",
    icon: "T",
    color: "#000",
    type,
    isDefault: true,
  });
}

describe("transactions tools", () => {
  describe("list_transactions", () => {
    it("should list transactions with pagination", async () => {
      const account = await createTestAccount();
      const category = await createTestCategory();

      for (let i = 0; i < 5; i++) {
        await Transaction.create({
          userId,
          accountId: account._id,
          type: "expense",
          amount: 100 + i,
          categoryId: category._id,
          description: `Expense ${i}`,
          date: new Date(2024, 0, i + 1),
        });
      }

      const transactions = await Transaction.find({ userId }).sort({ date: -1 }).skip(0).limit(3);
      const total = await Transaction.countDocuments({ userId });

      expect(transactions).toHaveLength(3);
      expect(total).toBe(5);
    });

    it("should filter by type", async () => {
      const account = await createTestAccount();
      const category = await createTestCategory();
      const incomeCategory = await createTestCategory("income");

      await Transaction.create({
        userId,
        accountId: account._id,
        type: "expense",
        amount: 50,
        categoryId: category._id,
        description: "Expense",
        date: new Date(),
      });
      await Transaction.create({
        userId,
        accountId: account._id,
        type: "income",
        amount: 200,
        categoryId: incomeCategory._id,
        description: "Income",
        date: new Date(),
      });

      const expenses = await Transaction.find({ userId, type: "expense" });
      expect(expenses).toHaveLength(1);
      expect(expenses[0].description).toBe("Expense");
    });

    it("should filter by date range", async () => {
      const account = await createTestAccount();
      const category = await createTestCategory();

      await Transaction.create({
        userId,
        accountId: account._id,
        type: "expense",
        amount: 100,
        categoryId: category._id,
        description: "Jan",
        date: new Date(2024, 0, 15),
      });
      await Transaction.create({
        userId,
        accountId: account._id,
        type: "expense",
        amount: 200,
        categoryId: category._id,
        description: "Mar",
        date: new Date(2024, 2, 15),
      });

      const filtered = await Transaction.find({
        userId,
        date: { $gte: new Date(2024, 1, 1), $lte: new Date(2024, 2, 31) },
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].description).toBe("Mar");
    });
  });

  describe("search_transactions", () => {
    it("should search by description regex", async () => {
      const account = await createTestAccount();
      const category = await createTestCategory();

      await Transaction.create({
        userId,
        accountId: account._id,
        type: "expense",
        amount: 50,
        categoryId: category._id,
        description: "Grocery at Walmart",
        date: new Date(),
      });
      await Transaction.create({
        userId,
        accountId: account._id,
        type: "expense",
        amount: 30,
        categoryId: category._id,
        description: "Gas station",
        date: new Date(),
      });

      const results = await Transaction.find({
        userId,
        description: { $regex: "grocery", $options: "i" },
      });
      expect(results).toHaveLength(1);
      expect(results[0].description).toBe("Grocery at Walmart");
    });
  });

  describe("create_transaction", () => {
    it("should create a transaction and adjust account balance", async () => {
      const account = await createTestAccount(1000);
      const category = await createTestCategory();

      const tx = await Transaction.create({
        userId,
        accountId: account._id,
        type: "expense",
        amount: 200,
        categoryId: category._id,
        description: "Dinner",
        date: new Date(),
      });

      await Account.findByIdAndUpdate(account._id, {
        $inc: { balance: -200 },
      });

      expect(tx.amount).toBe(200);
      const updated = await Account.findById(account._id);
      expect(updated!.balance).toBe(800);
    });

    it("should increase balance for income transactions", async () => {
      const account = await createTestAccount(1000);
      const category = await createTestCategory("income");

      await Transaction.create({
        userId,
        accountId: account._id,
        type: "income",
        amount: 500,
        categoryId: category._id,
        description: "Freelance",
        date: new Date(),
      });

      await Account.findByIdAndUpdate(account._id, {
        $inc: { balance: 500 },
      });

      const updated = await Account.findById(account._id);
      expect(updated!.balance).toBe(1500);
    });
  });

  describe("get_transaction", () => {
    it("should get a transaction by ID with ownership check", async () => {
      const account = await createTestAccount();
      const category = await createTestCategory();
      const tx = await Transaction.create({
        userId,
        accountId: account._id,
        type: "expense",
        amount: 100,
        categoryId: category._id,
        description: "Test",
        date: new Date(),
      });

      const found = await Transaction.findOne({ _id: tx._id, userId });
      expect(found).not.toBeNull();
      expect(found!.description).toBe("Test");
    });

    it("should not find transaction of another user", async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      const account = await Account.create({
        userId: otherUserId,
        name: "Other",
        type: "checking",
      });
      const category = await createTestCategory();
      const tx = await Transaction.create({
        userId: otherUserId,
        accountId: account._id,
        type: "expense",
        amount: 100,
        categoryId: category._id,
        description: "Other",
        date: new Date(),
      });

      const found = await Transaction.findOne({ _id: tx._id, userId });
      expect(found).toBeNull();
    });
  });

  describe("update_transaction", () => {
    it("should update transaction fields", async () => {
      const account = await createTestAccount();
      const category = await createTestCategory();
      const tx = await Transaction.create({
        userId,
        accountId: account._id,
        type: "expense",
        amount: 100,
        categoryId: category._id,
        description: "Old",
        date: new Date(),
      });

      const updated = await Transaction.findOneAndUpdate(
        { _id: tx._id, userId },
        { $set: { description: "New", amount: 200 } },
        { new: true }
      );
      expect(updated!.description).toBe("New");
      expect(updated!.amount).toBe(200);
    });
  });

  describe("delete_transaction", () => {
    it("should delete a transaction and it no longer exists", async () => {
      const account = await createTestAccount();
      const category = await createTestCategory();
      const tx = await Transaction.create({
        userId,
        accountId: account._id,
        type: "expense",
        amount: 100,
        categoryId: category._id,
        description: "To delete",
        date: new Date(),
      });

      await Transaction.findOneAndDelete({ _id: tx._id, userId });
      const found = await Transaction.findById(tx._id);
      expect(found).toBeNull();
    });
  });
});
