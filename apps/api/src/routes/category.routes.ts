import { Router } from "express";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import * as categoryController from "../controllers/category.controller";
import { createCategorySchema, updateCategorySchema } from "@wealthwise/shared-types";

const router = Router();

// All category routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List system default and user-specific categories with usage insights
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories enriched with usage and linkage metadata
 */
router.get("/", categoryController.list);

/**
 * @swagger
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a custom category
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, icon, color, type]
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *     responses:
 *       201:
 *         description: Category created
 */
router.post("/", validate(createCategorySchema), categoryController.create);

/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     tags: [Categories]
 *     summary: Update a custom category
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
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *     responses:
 *       200:
 *         description: Category updated
 *       403:
 *         description: Cannot modify system default categories
 */
router.patch("/:id", validate(updateCategorySchema), categoryController.update);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a custom category
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
 *         description: Category deleted
 *       403:
 *         description: Cannot delete system default categories
 *       409:
 *         description: Cannot delete categories that are still linked to other records
 */
router.delete("/:id", categoryController.remove);

export default router;
