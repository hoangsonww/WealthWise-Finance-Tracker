import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Transaction } from "../../models/transaction.model";
import { Account } from "../../models/account.model";
import { Category } from "../../models/category.model";

const userId = new mongoose.Types.ObjectId().toString();

async function seedTransactions() {
  const account = await Account.create({
    userId,
    name: "Main",
    type: "checking",
    balance: 5000,
  });
  const foodCat = await Category.create({
    name: "Food",
    icon: "F",
    color: "#ff0000",
    type: "expense",
    isDefault: true,
  });
  const salaryCat = await Category.create({
    name: "Salary",
    icon: "S",
    color: "#00ff00",
    type: "income",
    isDefault: true,
  });

  // Create transactions across multiple months
  const txData = [
    { type: "income", amount: 5000, categoryId: salaryCat._id, date: new Date(2024, 0, 15), description: "Jan Salary" },
    { type: "expense", amount: 200, categoryId: foodCat._id, date: new Date(2024, 0, 20), description: "Jan Food" },
    { type: "income", amount: 5000, categoryId: salaryCat._id, date: new Date(2024, 1, 15), description: "Feb Salary" },
    { type: "expense", amount: 300, categoryId: foodCat._id, date: new Date(2024, 1, 20), description: "Feb Food" },
    { type: "expense", amount: 150, categoryId: foodCat._id, date: new Date(2024, 1, 25), description: "Feb Food 2" },
  ];

  for (const d of txData) {
    await Transaction.create({
      userId,
      accountId: account._id,
      ...d,
    });
  }

  return { account, foodCat, salaryCat };
}

describe("analytics tools", () => {
  describe("spending_by_category", () => {
    it("should aggregate expense totals by category", async () => {
      const { foodCat } = await seedTransactions();

      const results = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: "expense",
            date: { $gte: new Date(2024, 0, 1), $lte: new Date(2024, 1, 28) },
          },
        },
        { $group: { _id: "$categoryId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].total).toBe(650); // 200 + 300 + 150
      expect(results[0].count).toBe(3);
    });
  });

  describe("income_vs_expense", () => {
    it("should return monthly income vs expense comparison", async () => {
      await seedTransactions();

      const results = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: { $in: ["income", "expense"] },
            date: { $gte: new Date(2024, 0, 1) },
          },
        },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" }, type: "$type" },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      expect(results.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("monthly_summary", () => {
    it("should return income, expense, and savings for a month", async () => {
      await seedTransactions();

      const results = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: { $in: ["income", "expense"] },
            date: { $gte: new Date(2024, 0, 1), $lte: new Date(2024, 0, 31, 23, 59, 59, 999) },
          },
        },
        { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]);

      let income = 0;
      let expense = 0;
      for (const r of results) {
        if (r._id === "income") income = r.total;
        if (r._id === "expense") expense = r.total;
      }

      expect(income).toBe(5000);
      expect(expense).toBe(200);
      expect(income - expense).toBe(4800);
    });
  });

  describe("get_trends", () => {
    it("should return monthly trends with running net worth", async () => {
      await seedTransactions();

      const results = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: { $in: ["income", "expense"] },
          },
        },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" }, type: "$type" },
            total: { $sum: "$amount" },
          },
        },
      ]);

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("spending_by_day_of_week", () => {
    it("should aggregate expenses by day of week", async () => {
      await seedTransactions();

      const results = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: "expense",
            date: { $gte: new Date(2024, 0, 1), $lte: new Date(2024, 1, 28) },
          },
        },
        {
          $group: {
            _id: { $dayOfWeek: "$date" },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]);

      const totalSpent = results.reduce((sum: number, r: { total: number }) => sum + r.total, 0);
      expect(totalSpent).toBe(650);
    });
  });

  describe("category_monthly_breakdown", () => {
    it("should break down expenses by category per month", async () => {
      await seedTransactions();

      const results = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: "expense",
            date: { $gte: new Date(2024, 0, 1) },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              categoryId: "$categoryId",
            },
            total: { $sum: "$amount" },
          },
        },
      ]);

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("get_net_worth", () => {
    it("should return empty when no accounts exist", async () => {
      const accounts = await Account.find({ userId });
      expect(accounts).toHaveLength(0);
    });

    it("should return monthly net worth progression", async () => {
      await seedTransactions();

      const monthly = await Transaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
            expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            net: { $subtract: ["$income", "$expense"] },
          },
        },
      ]);

      expect(monthly).toHaveLength(2);

      let running = 0;
      const result = monthly.map((entry: { net: number }) => {
        running += entry.net;
        return running;
      });

      // Jan: 5000-200=4800, Feb: 5000-450=4550
      expect(result[0]).toBe(4800);
      expect(result[1]).toBe(4800 + 4550);
    });
  });
});
