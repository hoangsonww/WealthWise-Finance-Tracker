import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Holding } from "../models/holding.model";
import { ApiError } from "../utils/api-error";
import {
  list,
  getById,
  create,
  update,
  remove,
  refreshPrices,
  getPortfolioSummary,
} from "../services/holding.service";

function userId() {
  return new mongoose.Types.ObjectId();
}

async function createTestHolding(
  userIdVal: mongoose.Types.ObjectId,
  overrides: Record<string, unknown> = {}
) {
  return Holding.create({
    userId: userIdVal,
    symbol: "AAPL",
    name: "Apple Inc.",
    assetClass: "stocks",
    quantity: 10,
    costBasis: 150,
    currentPrice: 170,
    currency: "USD",
    ...overrides,
  });
}

describe("holding.service", () => {
  describe("list", () => {
    it("should return empty array when no holdings exist", async () => {
      const result = await list(userId().toString());
      expect(result).toEqual([]);
    });

    it("should return all holdings for a user", async () => {
      const uid = userId();
      await createTestHolding(uid, { symbol: "AAPL" });
      await createTestHolding(uid, { symbol: "GOOG" });

      const result = await list(uid.toString());
      expect(result).toHaveLength(2);
    });

    it("should not return other users holdings", async () => {
      const uid1 = userId();
      const uid2 = userId();
      await createTestHolding(uid1, { symbol: "AAPL" });
      await createTestHolding(uid2, { symbol: "GOOG" });

      const result = await list(uid1.toString());
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe("AAPL");
    });

    it("should sort by createdAt descending", async () => {
      const uid = userId();
      await createTestHolding(uid, { symbol: "AAPL" });
      await new Promise((r) => setTimeout(r, 10));
      await createTestHolding(uid, { symbol: "TSLA" });

      const result = await list(uid.toString());
      expect(result[0].symbol).toBe("TSLA");
      expect(result[1].symbol).toBe("AAPL");
    });

    it("should include calculated fields", async () => {
      const uid = userId();
      await createTestHolding(uid, { quantity: 10, costBasis: 100, currentPrice: 150 });

      const result = await list(uid.toString());
      expect(result[0].marketValue).toBe(1500);
      expect(result[0].totalCostBasis).toBe(1000);
      expect(result[0].gainLoss).toBe(500);
      expect(result[0].gainLossPercent).toBe(50);
    });
  });

  describe("getById", () => {
    it("should return holding for valid id and userId", async () => {
      const uid = userId();
      const holding = await createTestHolding(uid);

      const result = await getById(uid.toString(), holding._id.toString());
      expect(result.id).toBe(holding._id.toString());
      expect(result.symbol).toBe("AAPL");
    });

    it("should throw 404 for non-existent id", async () => {
      const uid = userId();
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await getById(uid.toString(), fakeId);
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });

    it("should throw 404 when holding belongs to a different user", async () => {
      const uid1 = userId();
      const uid2 = userId();
      const holding = await createTestHolding(uid1);

      try {
        await getById(uid2.toString(), holding._id.toString());
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });
  });

  describe("create", () => {
    it("should create and return formatted holding with calculated fields", async () => {
      const uid = userId();
      const result = await create(uid.toString(), {
        symbol: "MSFT",
        name: "Microsoft Corp.",
        assetClass: "stocks",
        quantity: 5,
        costBasis: 200,
        currentPrice: 250,
        currency: "USD",
      });

      expect(result).toMatchObject({
        userId: uid.toString(),
        symbol: "MSFT",
        name: "Microsoft Corp.",
        assetClass: "stocks",
        quantity: 5,
        costBasis: 200,
        currentPrice: 250,
        currency: "USD",
        marketValue: 1250,
        totalCostBasis: 1000,
        gainLoss: 250,
        gainLossPercent: 25,
      });
      expect(result.id).toBeDefined();
    });

    it("should uppercase the symbol", async () => {
      const uid = userId();
      const result = await create(uid.toString(), {
        symbol: "tsla",
        name: "Tesla Inc.",
        assetClass: "stocks",
        quantity: 1,
        costBasis: 200,
        currentPrice: 220,
        currency: "USD",
      });
      expect(result.symbol).toBe("TSLA");
    });

    it("should default assetClass to stocks and currency to USD", async () => {
      const uid = userId();
      const result = await create(uid.toString(), {
        symbol: "SPY",
        name: "SPDR S&P 500",
        assetClass: "stocks",
        quantity: 2,
        costBasis: 400,
        currentPrice: 450,
        currency: "USD",
      });
      expect(result.assetClass).toBe("stocks");
      expect(result.currency).toBe("USD");
    });
  });

  describe("update", () => {
    it("should update fields and return updated holding", async () => {
      const uid = userId();
      const holding = await createTestHolding(uid);

      const result = await update(uid.toString(), holding._id.toString(), {
        currentPrice: 200,
        quantity: 20,
      });

      expect(result.currentPrice).toBe(200);
      expect(result.quantity).toBe(20);
      expect(result.marketValue).toBe(4000);
    });

    it("should throw 404 for non-existent holding", async () => {
      const uid = userId();
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await update(uid.toString(), fakeId, { currentPrice: 100 });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });

    it("should throw 404 when updating another users holding", async () => {
      const uid1 = userId();
      const uid2 = userId();
      const holding = await createTestHolding(uid1);

      try {
        await update(uid2.toString(), holding._id.toString(), { currentPrice: 999 });
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });
  });

  describe("remove", () => {
    it("should delete the holding and return it", async () => {
      const uid = userId();
      const holding = await createTestHolding(uid);

      const result = await remove(uid.toString(), holding._id.toString());
      expect(result.id).toBe(holding._id.toString());
      expect(await Holding.findById(holding._id)).toBeNull();
    });

    it("should throw 404 for non-existent holding", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await remove(userId().toString(), fakeId);
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });

    it("should throw 404 when deleting another users holding", async () => {
      const uid1 = userId();
      const uid2 = userId();
      const holding = await createTestHolding(uid1);

      try {
        await remove(uid2.toString(), holding._id.toString());
        expect.fail("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(404);
      }
    });
  });

  describe("refreshPrices", () => {
    it("should update prices for given holding IDs", async () => {
      const uid = userId();
      const h1 = await createTestHolding(uid, { symbol: "AAPL", currentPrice: 170 });
      const h2 = await createTestHolding(uid, { symbol: "TSLA", currentPrice: 200 });

      const result = await refreshPrices(uid.toString(), [
        { id: h1._id.toString(), currentPrice: 190 },
        { id: h2._id.toString(), currentPrice: 250 },
      ]);

      expect(result).toHaveLength(2);
      const aapl = result.find((h) => h.symbol === "AAPL");
      const tsla = result.find((h) => h.symbol === "TSLA");
      expect(aapl?.currentPrice).toBe(190);
      expect(tsla?.currentPrice).toBe(250);
    });

    it("should silently skip holdings that do not belong to the user", async () => {
      const uid1 = userId();
      const uid2 = userId();
      const holding = await createTestHolding(uid1);

      const result = await refreshPrices(uid2.toString(), [
        { id: holding._id.toString(), currentPrice: 999 },
      ]);

      expect(result).toHaveLength(0);
    });

    it("should return empty array for empty updates list after filtering", async () => {
      const uid = userId();
      const result = await refreshPrices(uid.toString(), []);
      expect(result).toEqual([]);
    });
  });

  describe("getPortfolioSummary", () => {
    it("should return zeroed summary when no holdings exist", async () => {
      const result = await getPortfolioSummary(userId().toString());
      expect(result).toMatchObject({
        totalMarketValue: 0,
        totalCostBasis: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        allocation: [],
        holdingCount: 0,
      });
    });

    it("should calculate totals and allocation correctly", async () => {
      const uid = userId();
      // Stocks: 10 shares @ 200 current, 150 cost → value=2000, cost=1500
      await createTestHolding(uid, {
        assetClass: "stocks",
        quantity: 10,
        costBasis: 150,
        currentPrice: 200,
      });
      // Crypto: 2 units @ 500 current, 300 cost → value=1000, cost=600
      await createTestHolding(uid, {
        symbol: "BTC",
        assetClass: "crypto",
        quantity: 2,
        costBasis: 300,
        currentPrice: 500,
      });

      const result = await getPortfolioSummary(uid.toString());

      expect(result.holdingCount).toBe(2);
      expect(result.totalMarketValue).toBe(3000);
      expect(result.totalCostBasis).toBe(2100);
      expect(result.totalGainLoss).toBe(900);
      // gainLossPercent = 900 / 2100 * 100 ≈ 42.86
      expect(result.totalGainLossPercent).toBeCloseTo(42.86, 1);

      expect(result.allocation).toHaveLength(2);
      const stockAlloc = result.allocation.find((a) => a.assetClass === "stocks");
      const cryptoAlloc = result.allocation.find((a) => a.assetClass === "crypto");
      expect(stockAlloc?.value).toBe(2000);
      expect(stockAlloc?.percentage).toBeCloseTo(66.67, 1);
      expect(cryptoAlloc?.value).toBe(1000);
      expect(cryptoAlloc?.percentage).toBeCloseTo(33.33, 1);
    });

    it("should not include other users holdings in summary", async () => {
      const uid1 = userId();
      const uid2 = userId();
      await createTestHolding(uid1, { currentPrice: 500, quantity: 5 });

      const result = await getPortfolioSummary(uid2.toString());
      expect(result.holdingCount).toBe(0);
      expect(result.totalMarketValue).toBe(0);
    });
  });
});
