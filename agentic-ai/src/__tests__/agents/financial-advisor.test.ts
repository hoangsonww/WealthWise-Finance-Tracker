import { describe, it, expect, vi, beforeEach } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { FinancialAdvisorAgent } from "../../agents/financial-advisor";
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

describe("FinancialAdvisorAgent", () => {
  let anthropic: Anthropic;
  let mcpClient: Client;
  let agent: FinancialAdvisorAgent;
  const tools: ClaudeTool[] = [
    {
      name: "monthly_summary",
      description: "Get monthly summary",
      input_schema: { type: "object", properties: { month: { type: "string" } } },
    },
  ];

  beforeEach(() => {
    anthropic = new Anthropic({ apiKey: "test" });
    mcpClient = new Client({ name: "test", version: "1.0.0" }, {});
    agent = new FinancialAdvisorAgent(anthropic);
  });

  it("should return a text response when no tools are called", async () => {
    (anthropic.messages.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [{ type: "text", text: "Your financial health score is 75/100." }],
      stop_reason: "end_turn",
      usage: { input_tokens: 100, output_tokens: 50 },
    });

    const result = await agent.run("Assess my finances", tools, mcpClient, []);

    expect(result.response).toBe("Your financial health score is 75/100.");
    expect(result.agent).toBe("financial-advisor");
    expect(result.toolCalls).toHaveLength(0);
    expect(result.usage.inputTokens).toBe(100);
    expect(result.usage.outputTokens).toBe(50);
  });

  it("should execute tool calls and return final response", async () => {
    // First call: Claude requests a tool
    (anthropic.messages.create as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        content: [
          {
            type: "tool_use",
            id: "tool_1",
            name: "monthly_summary",
            input: { month: "2024-01" },
          },
        ],
        stop_reason: "tool_use",
        usage: { input_tokens: 50, output_tokens: 30 },
      })
      // Second call: Claude returns text after seeing tool result
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "Based on your January data, your savings rate is 25%." }],
        stop_reason: "end_turn",
        usage: { input_tokens: 80, output_tokens: 60 },
      });

    (mcpClient.callTool as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [{ type: "text", text: '{"income": 5000, "expenses": 3750}' }],
    });

    const result = await agent.run("How did I do in January?", tools, mcpClient, []);

    expect(result.response).toBe("Based on your January data, your savings rate is 25%.");
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].name).toBe("monthly_summary");
    expect(result.usage.inputTokens).toBe(130);
    expect(result.usage.outputTokens).toBe(90);
  });

  it("should handle multiple sequential tool calls", async () => {
    (anthropic.messages.create as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        content: [
          { type: "tool_use", id: "tool_1", name: "monthly_summary", input: { month: "2024-01" } },
        ],
        stop_reason: "tool_use",
        usage: { input_tokens: 50, output_tokens: 30 },
      })
      .mockResolvedValueOnce({
        content: [
          { type: "tool_use", id: "tool_2", name: "monthly_summary", input: { month: "2024-02" } },
        ],
        stop_reason: "tool_use",
        usage: { input_tokens: 80, output_tokens: 30 },
      })
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "Comparing Jan and Feb..." }],
        stop_reason: "end_turn",
        usage: { input_tokens: 100, output_tokens: 50 },
      });

    (mcpClient.callTool as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ content: [{ type: "text", text: '{"income": 5000}' }] })
      .mockResolvedValueOnce({ content: [{ type: "text", text: '{"income": 5200}' }] });

    const result = await agent.run("Compare Jan and Feb", tools, mcpClient, []);

    expect(result.toolCalls).toHaveLength(2);
    expect(result.response).toBe("Comparing Jan and Feb...");
    expect(result.usage.inputTokens).toBe(230);
  });

  it("should handle tool execution errors gracefully", async () => {
    (anthropic.messages.create as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        content: [{ type: "tool_use", id: "tool_1", name: "monthly_summary", input: {} }],
        stop_reason: "tool_use",
        usage: { input_tokens: 50, output_tokens: 30 },
      })
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "I encountered an error fetching data." }],
        stop_reason: "end_turn",
        usage: { input_tokens: 80, output_tokens: 40 },
      });

    (mcpClient.callTool as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("MCP connection failed")
    );

    const result = await agent.run("Get my summary", tools, mcpClient, []);

    expect(result.response).toBe("I encountered an error fetching data.");
    expect(result.toolCalls).toHaveLength(1);
  });

  it("should use conversation history", async () => {
    (anthropic.messages.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [{ type: "text", text: "Based on our previous discussion..." }],
      stop_reason: "end_turn",
      usage: { input_tokens: 150, output_tokens: 60 },
    });

    const history: Anthropic.MessageParam[] = [
      { role: "user", content: "What is my savings rate?" },
      { role: "assistant", content: "Your savings rate is 20%." },
    ];

    const result = await agent.run("How can I improve it?", tools, mcpClient, history);

    expect(result.response).toBe("Based on our previous discussion...");
    const createCall = (anthropic.messages.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.messages).toHaveLength(3); // 2 history + 1 new
  });
});
