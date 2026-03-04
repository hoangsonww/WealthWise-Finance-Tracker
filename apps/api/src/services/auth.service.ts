import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/user.model";
import { Account } from "../models/account.model";
import { Transaction } from "../models/transaction.model";
import { Budget } from "../models/budget.model";
import { Goal } from "../models/goal.model";
import { RecurringRule } from "../models/recurring-rule.model";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

/**
 * Strip the password hash from a user document for safe API responses.
 */
function sanitizeUser(user: IUser) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    currency: user.currency,
    createdAt: user.createdAt.toISOString(),
  };
}

/**
 * Register a new user.
 */
export async function register(email: string, name: string, password: string) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict("A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({
    email: email.toLowerCase(),
    name,
    passwordHash,
  });

  const tokens = generateTokens(user._id.toString());

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

/**
 * Login with email and password.
 */
export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const tokens = generateTokens(user._id.toString());

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

/**
 * Generate an access/refresh token pair for the given userId.
 */
export function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
}

/**
 * Verify a refresh token and issue a new token pair.
 */
export function refreshToken(token: string) {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
      userId: string;
    };
    return generateTokens(decoded.userId);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }
}

/**
 * Get a user's profile by ID.
 */
export async function getProfile(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return sanitizeUser(user);
}

/**
 * Update the user's profile (name, currency).
 */
export async function updateProfile(userId: string, data: { name?: string; currency?: string }) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return sanitizeUser(user);
}

/**
 * Verify that a user with the given email exists (for forgot-password flow).
 * Throws 404 if not found.
 */
export async function verifyEmailExists(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw ApiError.notFound("No account found with this email address");
  }
}

/**
 * Reset a user's password directly (simplified flow — no email token).
 */
export async function resetPassword(email: string, newPassword: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw ApiError.notFound("No account found with this email address");
  }
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.passwordHash = passwordHash;
  await user.save();
}

export async function deleteAccount(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  // Delete all user data in parallel
  await Promise.all([
    Transaction.deleteMany({ userId }),
    Account.deleteMany({ userId }),
    Budget.deleteMany({ userId }),
    Goal.deleteMany({ userId }),
    RecurringRule.deleteMany({ userId }),
  ]);

  await User.findByIdAndDelete(userId);
}
