import express from "express";
import morgan from "morgan";
import { corsMiddleware } from "./middleware/cors";
import { generalLimiter } from "./middleware/rate-limit";
import { errorHandler } from "./middleware/error-handler";
import { swaggerSpec, getSwaggerHtml } from "./config/swagger";
import { env } from "./config/env";

// Route imports
import authRoutes from "./routes/auth.routes";
import accountRoutes from "./routes/account.routes";
import transactionRoutes from "./routes/transaction.routes";
import categoryRoutes from "./routes/category.routes";
import budgetRoutes from "./routes/budget.routes";
import goalRoutes from "./routes/goal.routes";
import recurringRoutes from "./routes/recurring.routes";
import analyticsRoutes from "./routes/analytics.routes";
import advisorRoutes from "./routes/advisor.routes";
import devRoutes from "./routes/dev.routes";

const app = express();

// Trust proxy headers from Vercel/reverse proxies
app.set("trust proxy", 1);

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(corsMiddleware);
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// ---------------------------------------------------------------------------
// Root redirect → Swagger docs
// ---------------------------------------------------------------------------
app.get("/", (_req, res) => {
  res.redirect("/api/docs");
});

// ---------------------------------------------------------------------------
// API documentation (Swagger UI loaded from CDN - no npm dependency)
// ---------------------------------------------------------------------------
app.get("/api/docs", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(getSwaggerHtml("/api/docs.json"));
});

// JSON endpoint for the raw OpenAPI spec
app.get("/api/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ---------------------------------------------------------------------------
// API routes (v1)
// ---------------------------------------------------------------------------
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/accounts", accountRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/budgets", budgetRoutes);
app.use("/api/v1/goals", goalRoutes);
app.use("/api/v1/recurring", recurringRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/advisor", advisorRoutes);

// Dev-only routes (seed, etc.) - never exposed in production
if (env.NODE_ENV !== "production") {
  app.use("/api/v1/dev", devRoutes);
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns server health status. Used by load balancers, container orchestrators, and monitoring systems. This endpoint is outside the /api/v1 prefix.
 *     tags: [Health]
 *     security: []
 *     servers:
 *       - url: /api
 *         description: Health endpoint base
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});

// ---------------------------------------------------------------------------
// 404 handler for unmatched routes
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested endpoint does not exist",
    },
  });
});

// ---------------------------------------------------------------------------
// Global error handler (must be registered last)
// ---------------------------------------------------------------------------
app.use(errorHandler);

export default app;
