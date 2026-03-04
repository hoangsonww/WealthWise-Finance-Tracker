import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpClientManager } from "../../mcp/client";

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue({
      tools: [
        { name: "monthly_summary", description: "Get monthly summary", inputSchema: { type: "object", properties: { month: { type: "string" } } } },
        { name: "list_transactions", description: "List transactions", inputSchema: { type: "object", properties: {} } },
      ],
    }),
    callTool: vi.fn().mockResolvedValue({
      content: [{ type: "text", text: '{"result": "success"}' }],
    }),
  })),
}));

vi.mock("@modelcontextprotocol/sdk/client/sse.js", () => ({
  SSEClientTransport: vi.fn().mockImplementation(() => ({})),
}));

describe("McpClientManager", () => {
  let manager: McpClientManager;

  beforeEach(() => {
    manager = new McpClientManager("http://localhost:5100");
  });

  describe("createClient", () => {
    it("should create and connect a client", async () => {
      const client = await manager.createClient("test-token");
      expect(client).toBeDefined();
      expect(client.connect).toHaveBeenCalled();
    });

    it("should throw when connection fails", async () => {
      const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
      (Client as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
        connect: vi.fn().mockRejectedValue(new Error("Connection refused")),
      }));

      const failManager = new McpClientManager("http://localhost:9999");
      await expect(failManager.createClient("token")).rejects.toThrow("Connection refused");
    });
  });

  describe("listTools", () => {
    it("should return available tools", async () => {
      const client = await manager.createClient("test-token");
      const tools = await manager.listTools(client);

      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe("monthly_summary");
      expect(tools[1].name).toBe("list_transactions");
    });
  });

  describe("callTool", () => {
    it("should execute a tool and return result", async () => {
      const client = await manager.createClient("test-token");
      const result = await manager.callTool(client, "monthly_summary", { month: "2024-01" });

      expect(result).toBe('{"result": "success"}');
      expect(client.callTool).toHaveBeenCalledWith({
        name: "monthly_summary",
        arguments: { month: "2024-01" },
      });
    });

    it("should throw when tool execution fails", async () => {
      const client = await manager.createClient("test-token");
      (client.callTool as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Tool not found")
      );

      await expect(manager.callTool(client, "nonexistent", {})).rejects.toThrow("Tool not found");
    });
  });
});
