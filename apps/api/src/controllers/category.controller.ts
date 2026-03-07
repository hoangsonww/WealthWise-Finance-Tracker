import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import * as categoryService from "../services/category.service";

/**
 * GET /categories
 * Returns system default categories (userId = null) and user-specific categories.
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoryService.list(req.userId!);

  res.status(200).json({
    success: true,
    data: categories,
  });
});

/**
 * POST /categories
 * Create a user-specific custom category.
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.create(req.userId!, req.body);

  res.status(201).json({
    success: true,
    data: category,
  });
});

/**
 * PATCH /categories/:id
 * Only user-owned categories can be updated (not system defaults).
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.update(req.userId!, req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: category,
  });
});

/**
 * DELETE /categories/:id
 * Only user-owned categories can be deleted.
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.remove(req.userId!, req.params.id);

  res.status(200).json({
    success: true,
    data: category,
    message: "Category deleted successfully",
  });
});
