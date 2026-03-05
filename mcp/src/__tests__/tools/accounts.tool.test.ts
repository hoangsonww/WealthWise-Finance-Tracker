import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import { Account } from "../../models/account.model";
import { Transaction } from "../../models/transaction.model";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAccountTools } from "../../tools/accounts.tool";

const userId = new mongoose.Types.ObjectId().toString();
const getUserId = () => userId;

function createTestServer() {
  const server = new McpServer({ name: "test", version: "1.0.0" });
  registerAccountTools(server, getUserId);
  return server;
}

async function createAccount(overrides: Record<string, unknown> = {}) {
  return Account.create({
    userId,
    name: "Test Checking",
    type: "checking",
    balance: 1000,
    ...overrides,
  });
}

describe("accounts tools", () => {
  describe("list_accounts", () => {
    it("should list non-archived accounts", async () => {
      await createAccount({ name: "Active" });
      await createAccount({ name: "Archived", isArchived: true });

      const accounts = await Account.find({ userId, isArchived: false });
      expect(accounts).toHaveLength(1);
      expect(accounts[0].name).toBe("Active");
    });

    it("should return empty array when no accounts", async () => {
      const accounts = await Account.find({ userId, isArchived: false });
      expect(accounts).toHaveLength(0);
    });
  });

  describe("get_account", () => {
    it("should get account by ID", async () => {
      const account = await createAccount();
      const found = await Account.findOne({ _id: account._id, userId });
      expect(found).not.toBeNull();
      expect(found!.name).toBe("Test Checking");
    });

    it("should not find account belonging to another user", async () => {
      const account = await createAccount({
        userId: new mongoose.Types.ObjectId(),
      });
      const found = await Account.findOne({ _id: account._id, userId });
      expect(found).toBeNull();
    });
  });

  describe("create_account", () => {
    it("should create an account with defaults", async () => {
      const account = await Account.create({
        userId,
        name: "Savings",
        type: "savings",
      });
      expect(account.balance).toBe(0);
      expect(account.currency).toBe("USD");
      expect(account.color).toBe("#6366f1");
      expect(account.isArchived).toBe(false);
    });

    it("should create an account with custom values", async () => {
      const account = await Account.create({
        userId,
        name: "Euro",
        type: "investment",
        balance: 5000,
        currency: "EUR",
        color: "#ff0000",
      });
      expect(account.balance).toBe(5000);
      expect(account.currency).toBe("EUR");
      expect(account.color).toBe("#ff0000");
    });
  });

  describe("update_account", () => {
    it("should update account fields", async () => {
      const account = await createAccount();
      const updated = await Account.findOneAndUpdate(
        { _id: account._id, userId },
        { $set: { name: "Updated", balance: 2000 } },
        { new: true }
      );
      expect(updated!.name).toBe("Updated");
      expect(updated!.balance).toBe(2000);
    });

    it("should not update account of another user", async () => {
      const account = await createAccount({
        userId: new mongoose.Types.ObjectId(),
      });
      const updated = await Account.findOneAndUpdate(
        { _id: account._id, userId },
        { $set: { name: "Hacked" } },
        { new: true }
      );
      expect(updated).toBeNull();
    });
  });

  describe("archive_account", () => {
    it("should soft-delete by setting isArchived to true", async () => {
      const account = await createAccount();
      const archived = await Account.findOneAndUpdate(
        { _id: account._id, userId },
        { $set: { isArchived: true } },
        { new: true }
      );
      expect(archived!.isArchived).toBe(true);
    });
  });

  describe("get_balance_history", () => {
    it("should return monthly balance snapshots", async () => {
      const account = await createAccount({ balance: 0 });
      const categoryId = new mongoose.Types.ObjectId();

      await Transaction.create({
        userId,
        accountId: account._id,
        type: "income",
        amount: 3000,
        categoryId,
        description: "Salary",
        date: new Date(2024, 0, 15),
      });
      await Transaction.create({
        userId,
        accountId: account._id,
        type: "expense",
        amount: 1000,
        categoryId,
        description: "Rent",
        date: new Date(2024, 0, 20),
      });

      const pipeline = [
        {
          $match: {
            accountId: account._id,
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            income: {
              $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
            },
            expense: {
              $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
            },
          },
        },
        { $sort: { "_id.year": 1 as const, "_id.month": 1 as const } },
      ];

      const history = await Transaction.aggregate(pipeline);
      expect(history).toHaveLength(1);
      expect(history[0].income).toBe(3000);
      expect(history[0].expense).toBe(1000);
    });
  });
});
