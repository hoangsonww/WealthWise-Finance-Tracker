import { Router } from "express";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rate-limit";
import * as authController from "../controllers/auth.controller";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@wealthwise/shared-types";

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */
router.post("/register", authLimiter, validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns tokens and user data
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", authLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using a refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New token pair issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", authLimiter, authController.refresh);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the current user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, authController.getMe);

/**
 * @swagger
 * /auth/me:
 *   patch:
 *     tags: [Auth]
 *     summary: Update the current user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               currency:
 *                 type: string
 *                 description: 3-letter ISO currency code
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 */
router.patch("/me", authenticate, validate(updateProfileSchema), authController.updateMe);

/**
 * @swagger
 * /auth/me:
 *   delete:
 *     tags: [Auth]
 *     summary: Permanently delete the current user's account and all data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *       401:
 *         description: Unauthorized
 */
router.delete("/me", authenticate, authController.deleteMe);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Verify that an account exists for the given email (forgot-password flow)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email verified — account exists
 *       400:
 *         description: Validation error
 *       404:
 *         description: No account found with this email address
 */
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset a user's password using their email and a new password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: >
 *                   Must be at least 8 characters and contain at least one uppercase
 *                   letter, one lowercase letter, and one number.
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: No account found with this email address
 */
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

export default router;
