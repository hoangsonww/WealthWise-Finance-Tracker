import { validateEnv } from "./config/env";
import { createServer } from "./server";
import { logger } from "./utils/logger";

function main() {
  const env = validateEnv();
  const { app, conversationManager } = createServer(env);

  const server = app.listen(env.AGENT_PORT, () => {
    logger.info({ port: env.AGENT_PORT, env: env.NODE_ENV }, "Agentic AI server started");
  });

  const shutdown = () => {
    logger.info("Shutting down gracefully...");
    conversationManager.stopCleanup();
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
