import { validateEnv } from "./config/env";
import { createServer } from "./server";
import { getContextIntegration } from "./context/context-integration";
import { logger } from "./utils/logger";

async function main() {
  const env = validateEnv();
  const { app, conversationManager } = await createServer(env);

  const server = app.listen(env.AGENT_PORT, () => {
    logger.info({ port: env.AGENT_PORT, env: env.NODE_ENV }, "Agentic AI server started");
  });

  const shutdown = () => {
    logger.info("Shutting down gracefully...");
    conversationManager.stopCleanup();

    const contextIntegration = getContextIntegration();
    if (contextIntegration) {
      contextIntegration.shutdown().catch((err) => {
        logger.error({ error: err }, "Error shutting down context integration");
      });
    }

    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  logger.error({ error }, "Failed to start server");
  process.exit(1);
});
