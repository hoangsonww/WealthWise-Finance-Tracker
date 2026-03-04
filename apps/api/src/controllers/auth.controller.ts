import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import * as authService from "../services/auth.service";
import { ApiError } from "../utils/api-error";

/**
 * POST /auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password } = req.body;
  const result = await authService.register(email, name, password);

  res.status(201).json({
    success: true,
    data: result,
  });
});

/**
 * POST /auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * POST /auth/refresh
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw ApiError.badRequest("Refresh token is required");
  }

  const tokens = authService.refreshToken(refreshToken);

  res.status(200).json({
    success: true,
    data: tokens,
  });
});

/**
 * GET /auth/me
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const user = await authService.getProfile(userId);

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * PATCH /auth/me
 */
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const user = await authService.updateProfile(userId, req.body);

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * POST /auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.verifyEmailExists(email);
  res.status(200).json({ success: true, data: null });
});

/**
 * POST /auth/reset-password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  await authService.resetPassword(email, password);
  res.status(200).json({ success: true, data: null });
});

/**
 * DELETE /auth/me
 */
export const deleteMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  await authService.deleteAccount(userId);

  res.status(200).json({
    success: true,
    data: null,
    message: "Account permanently deleted",
  });
});
