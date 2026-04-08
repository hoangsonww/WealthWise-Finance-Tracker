import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import * as holdingService from "../services/holding.service";

/**
 * GET /holdings
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const holdings = await holdingService.list(req.userId!);

  res.status(200).json({
    success: true,
    data: holdings,
  });
});

/**
 * POST /holdings
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const holding = await holdingService.create(req.userId!, req.body);

  res.status(201).json({
    success: true,
    data: holding,
  });
});

/**
 * GET /holdings/:id
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const holding = await holdingService.getById(req.userId!, req.params.id);

  res.status(200).json({
    success: true,
    data: holding,
  });
});

/**
 * PATCH /holdings/:id
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const holding = await holdingService.update(req.userId!, req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: holding,
  });
});

/**
 * DELETE /holdings/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const holding = await holdingService.remove(req.userId!, req.params.id);

  res.status(200).json({
    success: true,
    data: holding,
    message: "Holding deleted successfully",
  });
});

/**
 * POST /holdings/refresh-prices
 */
export const refreshPrices = asyncHandler(async (req: Request, res: Response) => {
  const updated = await holdingService.refreshPrices(req.userId!, req.body.updates);

  res.status(200).json({
    success: true,
    data: updated,
    message: `${updated.length} holding(s) updated`,
  });
});

/**
 * GET /holdings/summary
 */
export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await holdingService.getPortfolioSummary(req.userId!);

  res.status(200).json({
    success: true,
    data: summary,
  });
});
