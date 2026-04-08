import { Holding, IHolding } from "../models/holding.model";
import { ApiError } from "../utils/api-error";
import type { CreateHoldingInput, UpdateHoldingInput } from "@wealthwise/shared-types";

/** Round percentage values to two decimal places (multiply then divide by this). */
const PERCENT_PRECISION = 10000;

function formatHolding(holding: IHolding) {
  const marketValue = holding.currentPrice * holding.quantity;
  const totalCostBasis = holding.costBasis * holding.quantity;
  const gainLoss = marketValue - totalCostBasis;
  const gainLossPercent =
    totalCostBasis > 0 ? Math.round((gainLoss / totalCostBasis) * PERCENT_PRECISION) / 100 : 0;

  return {
    id: holding._id.toString(),
    userId: holding.userId.toString(),
    accountId: holding.accountId ? holding.accountId.toString() : null,
    symbol: holding.symbol,
    name: holding.name,
    assetClass: holding.assetClass,
    quantity: holding.quantity,
    costBasis: holding.costBasis,
    currentPrice: holding.currentPrice,
    currency: holding.currency,
    sector: holding.sector ?? null,
    notes: holding.notes ?? null,
    marketValue,
    totalCostBasis,
    gainLoss,
    gainLossPercent,
    createdAt: holding.createdAt.toISOString(),
    updatedAt: holding.updatedAt.toISOString(),
  };
}

/**
 * List all holdings for a user, sorted newest first.
 */
export async function list(userId: string) {
  const holdings = await Holding.find({ userId }).sort({ createdAt: -1 });
  return holdings.map(formatHolding);
}

/**
 * Get a single holding by ID. Verifies ownership.
 */
export async function getById(userId: string, holdingId: string) {
  const holding = await Holding.findOne({ _id: holdingId, userId });
  if (!holding) {
    throw ApiError.notFound("Holding not found");
  }
  return formatHolding(holding);
}

/**
 * Create a new holding.
 */
export async function create(userId: string, data: CreateHoldingInput) {
  const holding = await Holding.create({ userId, ...data });
  return formatHolding(holding);
}

/**
 * Update a holding. Verifies ownership.
 */
export async function update(userId: string, holdingId: string, data: UpdateHoldingInput) {
  const holding = await Holding.findOneAndUpdate(
    { _id: holdingId, userId },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!holding) {
    throw ApiError.notFound("Holding not found");
  }
  return formatHolding(holding);
}

/**
 * Delete a holding. Verifies ownership.
 */
export async function remove(userId: string, holdingId: string) {
  const holding = await Holding.findOneAndDelete({ _id: holdingId, userId });
  if (!holding) {
    throw ApiError.notFound("Holding not found");
  }
  return formatHolding(holding);
}

/**
 * Bulk-update current prices for multiple holdings.
 * Only updates holdings that belong to the authenticated user.
 */
export async function refreshPrices(
  userId: string,
  updates: { id: string; currentPrice: number }[]
) {
  const results = await Promise.all(
    updates.map(async ({ id, currentPrice }) => {
      const holding = await Holding.findOneAndUpdate(
        { _id: id, userId },
        { $set: { currentPrice } },
        { new: true, runValidators: true }
      );
      return holding ? formatHolding(holding) : null;
    })
  );

  return results.filter((h): h is ReturnType<typeof formatHolding> => h !== null);
}

/**
 * Portfolio-level summary: total market value, cost basis, gain/loss, and asset allocation.
 */
export async function getPortfolioSummary(userId: string) {
  const holdings = await Holding.find({ userId });

  let totalMarketValue = 0;
  let totalCostBasis = 0;

  const allocationMap = new Map<
    string,
    { value: number; count: number }
  >();

  for (const holding of holdings) {
    const marketValue = holding.currentPrice * holding.quantity;
    const costBasis = holding.costBasis * holding.quantity;
    totalMarketValue += marketValue;
    totalCostBasis += costBasis;

    const existing = allocationMap.get(holding.assetClass) ?? { value: 0, count: 0 };
    allocationMap.set(holding.assetClass, {
      value: existing.value + marketValue,
      count: existing.count + 1,
    });
  }

  const totalGainLoss = totalMarketValue - totalCostBasis;
  const totalGainLossPercent =
    totalCostBasis > 0 ? Math.round((totalGainLoss / totalCostBasis) * PERCENT_PRECISION) / 100 : 0;

  const allocation = Array.from(allocationMap.entries()).map(([assetClass, { value, count }]) => ({
    assetClass: assetClass as IHolding["assetClass"],
    value,
    count,
    percentage:
      totalMarketValue > 0 ? Math.round((value / totalMarketValue) * PERCENT_PRECISION) / 100 : 0,
  }));

  // Sort allocation by value descending
  allocation.sort((a, b) => b.value - a.value);

  return {
    totalMarketValue,
    totalCostBasis,
    totalGainLoss,
    totalGainLossPercent,
    allocation,
    holdingCount: holdings.length,
  };
}
