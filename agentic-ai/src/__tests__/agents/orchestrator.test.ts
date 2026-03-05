import { describe, it, expect, vi, beforeEach } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { OrchestratorAgent } from "../../agents/orchestrator";

vi.mock("@anthropic-ai/sdk", () => {
  const MockAnthropic = vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(),
    },
  }));
  return { default: MockAnthropic };
});

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: vi.fn(),
}));

describe("OrchestratorAgent", () => {
  let anthropic: Anthropic;
  let orchestrator: OrchestratorAgent;

  beforeEach(() => {
    anthropic = new Anthropic({ apiKey: "test" });
    orchestrator = new OrchestratorAgent(anthropic);
  });

  describe("route", () => {
    it("should route financial health requests to financial-advisor", async () => {
      (anthropic.messages.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        content: [
          { type: "text", text: '{"agent": "financial-advisor", "reason": "health assessment"}' },
        ],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const result = await orchestrator.route("How is my financial health?");
      expect(result.agent).toBe("financial-advisor");
    });

    it("should route anomaly requests to anomaly-detector", async () => {
      (anthropic.messages.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        content: [
          { type: "text", text: '{"agent": "anomaly-detector", "reason": "unusual spending"}' },
        ],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const result = await orchestrator.route("Are there any unusual transactions?");
      expect(result.agent).toBe("anomaly-detector");
    });

    it("should route budget requests to budget-optimizer", async () => {
      (anthropic.messages.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        content: [
          { type: "text", text: '{"agent": "budget-optimizer", "reason": "budget review"}' },
        ],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const result = await orchestrator.route("How can I optimize my budget?");
      expect(result.agent).toBe("budget-optimizer");
    });

    it("should route forecast requests to forecaster", async () => {
      (anthropic.messages.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        content: [{ type: "text", text: '{"agent": "forecaster", "reason": "future projection"}' }],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const result = await orchestrator.route("What will my finances look like in 6 months?");
      expect(result.agent).toBe("forecaster");
    });

    it("should default to financial-advisor on parse failure", async () => {
      (anthropic.messages.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        content: [{ type: "text", text: "invalid json" }],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const result = await orchestrator.route("something random");
      expect(result.agent).toBe("financial-advisor");
      expect(result.reason).toBe("Default routing");
    });

    it("should default to financial-advisor for unknown agent name", async () => {
      (anthropic.messages.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        content: [{ type: "text", text: '{"agent": "unknown-agent", "reason": "test"}' }],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const result = await orchestrator.route("test message");
      expect(result.agent).toBe("financial-advisor");
    });
  });

  describe("getAgent", () => {
    it("should return the correct agent by name", () => {
      expect(orchestrator.getAgent("financial-advisor")).toBeDefined();
      expect(orchestrator.getAgent("anomaly-detector")).toBeDefined();
      expect(orchestrator.getAgent("budget-optimizer")).toBeDefined();
      expect(orchestrator.getAgent("forecaster")).toBeDefined();
    });

    it("should return undefined for unknown agent", () => {
      expect(orchestrator.getAgent("unknown")).toBeUndefined();
    });
  });
});
