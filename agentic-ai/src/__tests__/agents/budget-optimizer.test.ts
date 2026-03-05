import { describe, it, expect, vi, beforeEach } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { BudgetOptimizerAgent } from "../../agents/budget-optimizer";
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

describe("BudgetOptimizerAgent", () => {
  let anthropic: Anthropic;
  let mcpClient: Client;
  let agent: BudgetOptimizerAgent;
  const tools: ClaudeTool[] = [
    {
      name: "get_budget_summary",
      description: "Get budget summary",
      input_schema: { type: "object", properties: {} },
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
    agent = new BudgetOptimizerAgent(anthropic);
  });

  it("should analyze budgets and suggest optimizations", async () => {
    (anthropic.messages.create as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        content: [{ type: "tool_use", id: "t1", name: "get_budget_summary", input: {} }],
        stop_reason: "tool_use",
        usage: { input_tokens: 60, output_tokens: 25 },
      })
      .mockResolvedValueOnce({
        content: [
          { type: "text", text: "| Category | Current | Recommended |\n| Dining | $500 | $350 |" },
        ],
        stop_reason: "end_turn",
        usage: { input_tokens: 120, output_tokens: 80 },
      });

    (mcpClient.callTool as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: '{"budgets": [{"category": "Dining", "amount": 500, "spent": 650}]}',
        },
      ],
    });

    const result = await agent.run("Optimize my budget", tools, mcpClient, []);

    expect(result.agent).toBe("budget-optimizer");
    expect(result.toolCalls).toHaveLength(1);
    expect(result.response).toContain("Dining");
  });

  it("should return text response with no tool calls when not needed", async () => {
    (anthropic.messages.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [{ type: "text", text: "Your budgets look well-balanced." }],
      stop_reason: "end_turn",
      usage: { input_tokens: 40, output_tokens: 15 },
    });

    const result = await agent.run("Quick budget check", tools, mcpClient, []);

    expect(result.response).toContain("well-balanced");
    expect(result.toolCalls).toHaveLength(0);
  });
});
