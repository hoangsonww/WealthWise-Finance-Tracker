import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as holdingController from "../controllers/holding.controller";
import {
  createHoldingSchema,
  updateHoldingSchema,
  refreshPricesSchema,
} from "@wealthwise/shared-types";

const router = Router();

// All holding routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /holdings/summary:
 *   get:
 *     tags: [Portfolio]
 *     summary: Get portfolio-level summary (total value, gain/loss, allocation)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portfolio summary
 */
router.get("/summary", holdingController.getSummary);

/**
 * @swagger
 * /holdings:
 *   get:
 *     tags: [Portfolio]
 *     summary: List all holdings for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of holdings
 */
router.get("/", holdingController.list);

/**
 * @swagger
 * /holdings:
 *   post:
 *     tags: [Portfolio]
 *     summary: Create a new investment holding
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symbol, name, quantity, costBasis, currentPrice]
 *             properties:
 *               symbol:
 *                 type: string
 *               name:
 *                 type: string
 *               assetClass:
 *                 type: string
 *                 enum: [stocks, etf, bonds, crypto, real_estate, cash, other]
 *               quantity:
 *                 type: number
 *               costBasis:
 *                 type: number
 *               currentPrice:
 *                 type: number
 *               currency:
 *                 type: string
 *               accountId:
 *                 type: string
 *               sector:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Holding created
 */
router.post("/", validate(createHoldingSchema), holdingController.create);

/**
 * @swagger
 * /holdings/refresh-prices:
 *   post:
 *     tags: [Portfolio]
 *     summary: Bulk update current prices for multiple holdings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [updates]
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [id, currentPrice]
 *                   properties:
 *                     id:
 *                       type: string
 *                     currentPrice:
 *                       type: number
 *     responses:
 *       200:
 *         description: Prices updated
 */
router.post("/refresh-prices", validate(refreshPricesSchema), holdingController.refreshPrices);

/**
 * @swagger
 * /holdings/{id}:
 *   get:
 *     tags: [Portfolio]
 *     summary: Get a specific holding by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Holding details
 *       404:
 *         description: Holding not found
 */
router.get("/:id", holdingController.getById);

/**
 * @swagger
 * /holdings/{id}:
 *   patch:
 *     tags: [Portfolio]
 *     summary: Update a holding
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symbol:
 *                 type: string
 *               name:
 *                 type: string
 *               quantity:
 *                 type: number
 *               costBasis:
 *                 type: number
 *               currentPrice:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Holding updated
 */
router.patch("/:id", validate(updateHoldingSchema), holdingController.update);

/**
 * @swagger
 * /holdings/{id}:
 *   delete:
 *     tags: [Portfolio]
 *     summary: Delete a holding
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Holding deleted
 */
router.delete("/:id", holdingController.remove);

export default router;
