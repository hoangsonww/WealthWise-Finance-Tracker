import { describe, it, expect, vi, beforeEach } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ForecasterAgent } from "../../agents/forecaster";
import { ClaudeTool } from "../../mcp/tool-adapter";

vi.mock("@anthropic-ai/sdk", () => {
  const MockAnthropic = vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(),
    },
  }));
  return { default: MockAnthropic };
});

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: vi.fn().mockImplementation(() => ({
    callTool: vi.fn(),
  })),
}));

describe("ForecasterAgent", () => {
  let anthropic: Anthropic;
  let mcpClient: Client;
  let agent: ForecasterAgent;
  const tools: ClaudeTool[] = [
    {
      name: "get_trends",
      description: "Get spending trends",
      input_schema: { type: "object", properties: { months: { type: "number" } } },
    },
    {
      name: "list_goals",
      description: "List savings goals",
      input_schema: { type: "object", properties: {} },
    },
    {
      name: "get_upcoming_bills",
      description: "Get upcoming bills",
      input_schema: { type: "object", properties: {} },
    },
  ];

  beforeEach(() => {
    anthropic = new Anthropic({ apiKey: "test" });
    mcpClient = new Client({ name: "test", version: "1.0.0" }, {});
    agent = new ForecasterAgent(anthropic);
  });

  it("should produce financial projections using multiple tools", async () => {
    (anthropic.messages.create as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        content: [
          { type: "tool_use", id: "t1", name: "get_trends", input: { months: 6 } },
          { type: "tool_use", id: "t2", name: "list_goals", input: {} },
        ],
        stop_reason: "tool_use",
        usage: { input_tokens: 70, output_tokens: 40 },
      })
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "## 3-Month Forecast\nProjected savings: $3,600\n## Goal Timeline\nEmergency fund: Complete by August 2024" }],
        stop_reason: "end_turn",
        usage: { input_tokens: 160, output_tokens: 100 },
      });

    (mcpClient.callTool as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ content: [{ type: "text", text: '{"avgIncome": 5000, "avgExpenses": 3800}' }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: '[{"name": "Emergency Fund", "target": 10000, "current": 6400}]' }] });

    const result = await agent.run("Project my finances", tools, mcpClient, []);

    expect(result.agent).toBe("forecaster");
    expect(result.toolCalls).toHaveLength(2);
    expect(result.response).toContain("3-Month Forecast");
    expect(result.response).toContain("Goal Timeline");
  });

  it("should handle parallel tool calls in a single response", async () => {
    (anthropic.messages.create as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        content: [
          { type: "tool_use", id: "t1", name: "get_trends", input: { months: 12 } },
          { type: "tool_use", id: "t2", name: "get_upcoming_bills", input: {} },
          { type: "tool_use", id: "t3", name: "list_goals", input: {} },
        ],
        stop_reason: "tool_use",
        usage: { input_tokens: 80, output_tokens: 50 },
      })
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "Comprehensive forecast complete." }],
        stop_reason: "end_turn",
        usage: { input_tokens: 200, output_tokens: 120 },
      });

    (mcpClient.callTool as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ content: [{ type: "text", text: '{"data": "trends"}' }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: '{"data": "bills"}' }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: '{"data": "goals"}' }] });

    const result = await agent.run("Full year forecast", tools, mcpClient, []);

    expect(result.toolCalls).toHaveLength(3);
    expect(result.usage.inputTokens).toBe(280);
    expect(result.usage.outputTokens).toBe(170);
  });
});
