import { z } from "zod";

/**
 * Schema for user registration.
 * Enforces strong password policy: minimum 8 characters with at least
 * one uppercase letter, one lowercase letter, and one digit.
 */
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

/**
 * Schema for user login.
 */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Schema for updating user profile fields.
 * All fields are optional; only provided fields will be updated.
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .optional(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-character ISO code")
    .toUpperCase()
    .optional(),
});

/**
 * Schema representing the user object returned from the API.
 */
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().url().nullable().optional(),
  currency: z.string().length(3),
  createdAt: z.string().datetime(),
});

/**
 * Schema for forgot password — verifies the email exists.
 */
export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
});

/**
 * Schema for resetting the password (email + new password).
 * Reuses the same password policy as registration.
 */
export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});
