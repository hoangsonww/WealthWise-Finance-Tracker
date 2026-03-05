import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveUserId } from "../auth/token-resolver";
import { logger } from "../utils/logger";

export function startSseTransport(
  server: McpServer,
  port: number,
  setUserId: (id: string) => void
): void {
  const app = express();

  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (_req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", transport: "sse" });
  });

  let sseTransport: SSEServerTransport | null = null;

  app.get("/sse", (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

      const userId = resolveUserId("sse", token);
      setUserId(userId);

      sseTransport = new SSEServerTransport("/messages", res);
      server.connect(sseTransport).catch((error) => {
        logger.error({ error }, "Failed to connect SSE transport");
      });
    } catch (error) {
      logger.error({ error }, "SSE connection error");
      res.status(401).json({ error: "Unauthorized" });
    }
  });

  app.post("/messages", (req, res) => {
    if (!sseTransport) {
      res.status(400).json({ error: "No active SSE connection" });
      return;
    }
    sseTransport.handlePostMessage(req, res);
  });

  app.listen(port, () => {
    logger.info(`MCP SSE server listening on port ${port}`);
  });
}
