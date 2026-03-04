import rateLimit from "express-rate-limit";
import { AuthenticatedRequest } from "./auth";

export const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => (req as AuthenticatedRequest).userId ?? req.ip ?? "unknown",
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many chat requests. Limit: 20 per minute." },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const insightsRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => (req as AuthenticatedRequest).userId ?? req.ip ?? "unknown",
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many insights requests. Limit: 10 per minute." },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
