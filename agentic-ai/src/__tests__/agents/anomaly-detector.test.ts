import { describe, it, expect, vi, beforeEach } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { AnomalyDetectorAgent } from "../../agents/anomaly-detector";
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

describe("AnomalyDetectorAgent", () => {
  let anthropic: Anthropic;
  let mcpClient: Client;
  let agent: AnomalyDetectorAgent;
  const tools: ClaudeTool[] = [
    {
      name: "list_transactions",
      description: "List transactions",
      input_schema: { type: "object", properties: { days: { type: "number" } } },
    },
    {
      name: "spending_by_category",
      description: "Spending by category",
      input_schema: { type: "object", properties: {} },
    },
  ];

  beforeEach(() => {
    anthropic = new Anthropic({ apiKey: "test" });
    mcpClient = new Client({ name: "test", version: "1.0.0" }, {});
    agent = new AnomalyDetectorAgent(anthropic);
  });

  it("should return anomaly analysis after tool calls", async () => {
    (anthropic.messages.create as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        content: [{ type: "tool_use", id: "t1", name: "list_transactions", input: { days: 90 } }],
        stop_reason: "tool_use",
        usage: { input_tokens: 60, output_tokens: 30 },
      })
      .mockResolvedValueOnce({
        content: [{ type: "tool_use", id: "t2", name: "spending_by_category", input: {} }],
        stop_reason: "tool_use",
        usage: { input_tokens: 100, output_tokens: 30 },
      })
      .mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: "## Anomaly Report\n- WARNING: Dining spending 180% above average",
          },
        ],
        stop_reason: "end_turn",
        usage: { input_tokens: 150, output_tokens: 80 },
      });

    (mcpClient.callTool as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        content: [{ type: "text", text: '[{"amount": 500, "category": "Dining"}]' }],
      })
      .mockResolvedValueOnce({
        content: [{ type: "text", text: '{"Dining": 1500, "Groceries": 400}' }],
      });

    const result = await agent.run("Check for anomalies", tools, mcpClient, []);

    expect(result.agent).toBe("anomaly-detector");
    expect(result.toolCalls).toHaveLength(2);
    expect(result.response).toContain("Anomaly Report");
  });

  it("should handle no anomalies found", async () => {
    (anthropic.messages.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [{ type: "text", text: "No anomalies detected in your recent spending." }],
      stop_reason: "end_turn",
      usage: { input_tokens: 50, output_tokens: 20 },
    });

    const result = await agent.run("Any unusual spending?", tools, mcpClient, []);

    expect(result.response).toContain("No anomalies");
    expect(result.toolCalls).toHaveLength(0);
  });
});
