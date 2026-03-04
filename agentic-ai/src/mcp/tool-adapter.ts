import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { logger } from "../utils/logger";

interface ClaudeTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpTool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export function mcpToolsToClaudeTools(mcpTools: McpTool[]): ClaudeTool[] {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description ?? "",
    input_schema: {
      type: "object" as const,
      properties: tool.inputSchema?.properties ?? {},
      required: tool.inputSchema?.required,
    },
  }));
}

export async function executeToolViaMcp(
  client: Client,
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
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
    logger.error({ error, toolName }, "Tool execution failed");
    return JSON.stringify({ error: `Tool ${toolName} failed: ${error}` });
  }
}

export type { ClaudeTool, McpTool };
