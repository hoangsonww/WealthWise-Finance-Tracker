import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { logger } from "../utils/logger";

export class McpClientManager {
  private mcpServerUrl: string;

  constructor(mcpServerUrl: string) {
    this.mcpServerUrl = mcpServerUrl;
  }

  async createClient(userToken: string): Promise<Client> {
    const url = new URL(this.mcpServerUrl);
    const transport = new SSEClientTransport(url, {
      requestInit: {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      },
    });

    const client = new Client({ name: "wealthwise-agent", version: "1.0.0" }, { capabilities: {} });

    try {
      await client.connect(transport);
      logger.info("MCP client connected successfully");
    } catch (error) {
      logger.error({ error }, "Failed to connect MCP client");
      throw error;
    }

    return client;
  }

  async listTools(client: Client) {
    try {
      const result = await client.listTools();
      return result.tools;
    } catch (error) {
      logger.error({ error }, "Failed to list MCP tools");
      throw error;
    }
  }

  async callTool(client: Client, toolName: string, args: Record<string, unknown>): Promise<string> {
    try {
      const result = await client.callTool({ name: toolName, arguments: args });
      const content = result.content;
      if (Array.isArray(content)) {
        return content
          .map((c) => {
            if (typeof c === "object" && c !== null && "text" in c) {
              return (c as { text: string }).text;
            }
            return JSON.stringify(c);
          })
          .join("\n");
      }
      return JSON.stringify(content);
    } catch (error) {
      logger.error({ error, toolName, args }, "Failed to call MCP tool");
      throw error;
    }
  }
}
