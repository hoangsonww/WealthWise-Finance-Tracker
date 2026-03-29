import { z } from "zod";

/**
 * Supported asset classes for portfolio holdings.
 */
export const assetClassEnum = z.enum([
  "stocks",
  "etf",
  "bonds",
  "crypto",
  "real_estate",
  "cash",
  "other",
]);

/**
 * Schema for creating a new investment holding.
 */
export const createHoldingSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required")
    .max(20, "Symbol must be at most 20 characters")
    .toUpperCase(),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  assetClass: assetClassEnum.default("stocks"),
  quantity: z.number().positive("Quantity must be a positive number"),
  costBasis: z.number().nonnegative("Cost basis must be non-negative"),
  currentPrice: z.number().nonnegative("Current price must be non-negative"),
  currency: z
    .string()
    .length(3, "Currency must be a 3-character ISO code")
    .toUpperCase()
    .default("USD"),
  accountId: z.string().optional(),
  sector: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(500).optional(),
});

/**
 * Schema for updating an existing holding. All fields are optional.
 */
export const updateHoldingSchema = createHoldingSchema.partial();

/**
 * Schema for a bulk price refresh payload item.
 */
export const priceUpdateItemSchema = z.object({
  id: z.string().min(1, "Holding ID is required"),
  currentPrice: z.number().nonnegative("Price must be non-negative"),
});

/**
 * Schema for the bulk price refresh request body.
 */
export const refreshPricesSchema = z.object({
  updates: z.array(priceUpdateItemSchema).min(1, "At least one price update is required"),
});

/**
 * Schema representing a holding object returned from the API.
 * Includes derived/calculated fields.
 */
export const holdingResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  accountId: z.string().nullable(),
  symbol: z.string(),
  name: z.string(),
  assetClass: assetClassEnum,
  quantity: z.number(),
  costBasis: z.number(),
  currentPrice: z.number(),
  currency: z.string(),
  sector: z.string().nullable(),
  notes: z.string().nullable(),
  marketValue: z.number(),
  totalCostBasis: z.number(),
  gainLoss: z.number(),
  gainLossPercent: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Schema for a single asset-class allocation bucket.
 */
export const holdingAllocationSchema = z.object({
  assetClass: assetClassEnum,
  value: z.number(),
  percentage: z.number(),
  count: z.number(),
});

/**
 * Schema for the portfolio-level summary returned by the analytics endpoint.
 */
export const portfolioSummarySchema = z.object({
  totalMarketValue: z.number(),
  totalCostBasis: z.number(),
  totalGainLoss: z.number(),
  totalGainLossPercent: z.number(),
  allocation: z.array(holdingAllocationSchema),
  holdingCount: z.number(),
});

export const holdingListResponseSchema = z.array(holdingResponseSchema);
