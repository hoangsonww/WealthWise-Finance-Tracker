import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAllTools } from "./tools";
import { registerAllResources } from "./resources";

export interface ServerContext {
  server: McpServer;
  getUserId: () => string;
  setUserId: (id: string) => void;
}

export function createMcpServer(): ServerContext {
  let currentUserId = "";

  const getUserId = (): string => {
    if (!currentUserId) {
      throw new Error("No authenticated user. userId is not set.");
    }
    return currentUserId;
  };

  const setUserId = (id: string): void => {
    currentUserId = id;
  };

  const server = new McpServer({
    name: "wealthwise-mcp",
    version: "1.0.0",
  });

  registerAllTools(server, getUserId);
  registerAllResources(server, getUserId);

  return { server, getUserId, setUserId };
}
