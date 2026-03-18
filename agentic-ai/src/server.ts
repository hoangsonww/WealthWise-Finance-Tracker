import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { Env } from "./config/env";
import { authMiddleware } from "./middleware/auth";
import { createAgentRoutes } from "./routes/agent.routes";
import { createHealthRoutes } from "./routes/health.routes";
import { McpClientManager } from "./mcp/client";
import { ConversationManager } from "./conversation/manager";
import { initContextIntegration } from "./context/context-integration";
import { logger } from "./utils/logger";

export async function createServer(env: Env) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use((req, _res, next) => {
    logger.info({ method: req.method, url: req.url }, "incoming request");
    next();
  });

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const mcpManager = new McpClientManager(env.MCP_SERVER_URL);
  const conversationManager = new ConversationManager();

  conversationManager.startCleanup();

  // Initialize context integration if enabled
  if (env.CONTEXT_ENABLED) {
    try {
      const contextIntegration = initContextIntegration({
        mongoUri: env.MONGODB_URI,
      });
      await contextIntegration.initialize();
      logger.info("Context integration initialized");
    } catch (error) {
      logger.warn(
        { error },
        "Failed to initialize context integration, agents will use base prompts only"
      );
    }
  }

  app.use(createHealthRoutes());

  app.use(
    "/api/v1/agent",
    authMiddleware(env.JWT_SECRET),
    createAgentRoutes(anthropic, mcpManager, conversationManager)
  );

  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error({ error: err.message }, "Unhandled error");
      res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      });
    }
  );

  return { app, conversationManager };
}
