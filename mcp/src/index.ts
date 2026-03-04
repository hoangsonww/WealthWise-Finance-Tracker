import { validateEnv } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./db/connection";
import { createMcpServer } from "./server";
import { startStdioTransport } from "./transport/stdio";
import { startSseTransport } from "./transport/sse";
import { resolveUserId } from "./auth/token-resolver";
import { logger } from "./utils/logger";

async function main(): Promise<void> {
  const env = validateEnv();

  await connectDatabase(env.MONGODB_URI);

  const { server, setUserId } = createMcpServer();

  if (env.MCP_TRANSPORT === "stdio") {
    const userId = resolveUserId("stdio");
    setUserId(userId);
    await startStdioTransport(server);
  } else {
    startSseTransport(server, env.MCP_PORT, setUserId);
  }

  const shutdown = async () => {
    logger.info("Shutting down MCP server...");
    await server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  logger.error({ error }, "Failed to start MCP server");
  process.exit(1);
});
