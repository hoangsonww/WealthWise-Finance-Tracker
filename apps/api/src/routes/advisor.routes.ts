import { Router } from "express";
import { advisorChatRequestSchema } from "@wealthwise/shared-types";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as advisorController from "../controllers/advisor.controller";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /advisor/chat:
 *   post:
 *     tags: [Advisor]
 *     summary: Chat with the AI financial advisor using the user's live finance data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [role, content]
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Advisor response grounded in the user's finance data
 */
router.post("/chat", validate(advisorChatRequestSchema), advisorController.chat);

export default router;
