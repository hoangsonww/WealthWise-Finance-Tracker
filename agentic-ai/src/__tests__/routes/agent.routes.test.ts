import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../../middleware/auth";
import { ConversationManager } from "../../conversation/manager";

const mockRun = vi.fn().mockResolvedValue({
  response: "Test response",
  agent: "financial-advisor",
  toolCalls: [],
  usage: { inputTokens: 100, outputTokens: 50 },
});

const mockRoute = vi.fn().mockResolvedValue({
  agent: "financial-advisor",
  reason: "test",
});

vi.mock("@anthropic-ai/sdk", () => {
  const MockAnthropic = vi.fn().mockImplementation(() => ({
    messages: { create: vi.fn() },
  }));
  return { default: MockAnthropic };
});

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: vi.fn(),
}));

vi.mock("@modelcontextprotocol/sdk/client/sse.js", () => ({
  SSEClientTransport: vi.fn(),
}));

vi.mock("../../mcp/client", () => ({
  McpClientManager: vi.fn().mockImplementation(() => ({
    createClient: vi.fn().mockResolvedValue({
      callTool: vi.fn(),
      listTools: vi.fn().mockResolvedValue({ tools: [] }),
    }),
    listTools: vi.fn().mockResolvedValue([]),
    callTool: vi.fn(),
  })),
}));

vi.mock("../../agents/orchestrator", () => ({
  OrchestratorAgent: vi.fn().mockImplementation(() => ({
    run: mockRun,
    route: mockRoute,
    getAgent: vi.fn(),
    getSystemPrompt: vi.fn().mockReturnValue("test"),
  })),
}));

vi.mock("../../agents/financial-advisor", () => ({
  FinancialAdvisorAgent: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue({
      response: "Financial advisor response",
      agent: "financial-advisor",
      toolCalls: [],
      usage: { inputTokens: 80, outputTokens: 40 },
    }),
    getSystemPrompt: vi.fn().mockReturnValue("test"),
  })),
}));

vi.mock("../../agents/anomaly-detector", () => ({
  AnomalyDetectorAgent: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue({
      response: "Anomaly detector response",
      agent: "anomaly-detector",
      toolCalls: [],
      usage: { inputTokens: 60, outputTokens: 30 },
    }),
    getSystemPrompt: vi.fn().mockReturnValue("test"),
  })),
}));

vi.mock("../../agents/budget-optimizer", () => ({
  BudgetOptimizerAgent: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue({
      response: "Budget optimizer response",
      agent: "budget-optimizer",
      toolCalls: [],
      usage: { inputTokens: 70, outputTokens: 35 },
    }),
    getSystemPrompt: vi.fn().mockReturnValue("test"),
  })),
}));

vi.mock("../../agents/forecaster", () => ({
  ForecasterAgent: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue({
      response: "Forecaster response",
      agent: "forecaster",
      toolCalls: [],
      usage: { inputTokens: 90, outputTokens: 45 },
    }),
    getSystemPrompt: vi.fn().mockReturnValue("test"),
  })),
}));

// Import after mocks are set up
import { createAgentRoutes } from "../../routes/agent.routes";
import { McpClientManager } from "../../mcp/client";
import Anthropic from "@anthropic-ai/sdk";

const JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long";

function makeToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
}

async function makeRequest(
  app: express.Express,
  method: string,
  path: string,
  body?: unknown,
  token?: string
) {
  return new Promise<{ status: number; body: unknown }>((resolve) => {
    const req = {
      method: method.toUpperCase(),
      url: path,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body,
      ip: "127.0.0.1",
    } as unknown as express.Request;

    const resData: { statusCode: number; jsonData: unknown } = {
      statusCode: 200,
      jsonData: null,
    };
    const res = {
      status(code: number) {
        resData.statusCode = code;
        return this;
      },
      json(data: unknown) {
        resData.jsonData = data;
        resolve({ status: resData.statusCode, body: data });
      },
      setHeader: vi.fn(),
      getHeader: vi.fn(),
    } as unknown as express.Response;

    app(req as express.Request, res as express.Response, () => {
      resolve({ status: 404, body: { error: "Not found" } });
    });
  });
}

describe("Agent Routes", () => {
  let app: express.Express;

  beforeEach(() => {
    const anthropic = new Anthropic({ apiKey: "test" });
    const mcpManager = new McpClientManager("http://localhost:5100");
    const conversationManager = new ConversationManager();

    app = express();
    app.use(express.json());
    app.use(
      "/api/v1/agent",
      authMiddleware(JWT_SECRET),
      createAgentRoutes(anthropic, mcpManager, conversationManager)
    );
  });

  describe("auth middleware", () => {
    it("should reject requests without auth token", async () => {
      const result = await makeRequest(
        app,
        "POST",
        "/api/v1/agent/chat",
        { message: "test" }
      );
      expect(result.status).toBe(401);
    });

    it("should reject requests with invalid token", async () => {
      const result = await makeRequest(
        app,
        "POST",
        "/api/v1/agent/chat",
        { message: "test" },
        "invalid-token"
      );
      expect(result.status).toBe(401);
    });
  });

  describe("POST /api/v1/agent/chat", () => {
    it("should reject missing message", async () => {
      const token = makeToken("user-1");
      const result = await makeRequest(
        app,
        "POST",
        "/api/v1/agent/chat",
        {},
        token
      );
      expect(result.status).toBe(400);
      expect((result.body as { success: boolean }).success).toBe(false);
    });

    it("should return agent response for valid request", async () => {
      const token = makeToken("user-1");
      const result = await makeRequest(
        app,
        "POST",
        "/api/v1/agent/chat",
        { message: "How am I doing?" },
        token
      );
      expect(result.status).toBe(200);
      const body = result.body as {
        success: boolean;
        data: { response: string; agent: string; usage: object };
      };
      expect(body.success).toBe(true);
      expect(body.data.response).toBeDefined();
      expect(body.data.agent).toBeDefined();
      expect(body.data.usage).toBeDefined();
    });
  });

  describe("POST /api/v1/agent/insights", () => {
    it("should reject invalid insight type", async () => {
      const token = makeToken("user-1");
      const result = await makeRequest(
        app,
        "POST",
        "/api/v1/agent/insights",
        { type: "invalid" },
        token
      );
      expect(result.status).toBe(400);
    });

    it("should accept valid insight type", async () => {
      const token = makeToken("user-1");
      const result = await makeRequest(
        app,
        "POST",
        "/api/v1/agent/insights",
        { type: "financial-health" },
        token
      );
      expect(result.status).toBe(200);
      const body = result.body as { success: boolean; data: { agent: string } };
      expect(body.success).toBe(true);
    });
  });

  describe("DELETE /api/v1/agent/conversations/:id", () => {
    it("should clear conversation", async () => {
      const token = makeToken("user-1");
      const result = await makeRequest(
        app,
        "DELETE",
        "/api/v1/agent/conversations/abc-123",
        undefined,
        token
      );
      expect(result.status).toBe(200);
      const body = result.body as { success: boolean };
      expect(body.success).toBe(true);
    });
  });
});
