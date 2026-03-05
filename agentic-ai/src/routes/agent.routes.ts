import { Router, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { AuthenticatedRequest } from "../middleware/auth";
import { chatRateLimit, insightsRateLimit } from "../middleware/rate-limit";
import { McpClientManager } from "../mcp/client";
import { mcpToolsToClaudeTools } from "../mcp/tool-adapter";
import { OrchestratorAgent } from "../agents/orchestrator";
import { FinancialAdvisorAgent } from "../agents/financial-advisor";
import { AnomalyDetectorAgent } from "../agents/anomaly-detector";
import { BudgetOptimizerAgent } from "../agents/budget-optimizer";
import { ForecasterAgent } from "../agents/forecaster";
import { ConversationManager } from "../conversation/manager";
import { costTracker } from "../utils/cost-tracker";
import { logger } from "../utils/logger";

const INSIGHT_AGENT_MAP: Record<string, string> = {
  "financial-health": "financial-advisor",
  anomalies: "anomaly-detector",
  "budget-review": "budget-optimizer",
  forecast: "forecaster",
};

const INSIGHT_PROMPTS: Record<string, string> = {
  "financial-health": "Give me a comprehensive financial health assessment.",
  anomalies: "Analyze my recent transactions for any unusual spending patterns or anomalies.",
  "budget-review": "Review my budgets and suggest optimizations.",
  forecast: "Project my financial outlook for the next 3, 6, and 12 months.",
};

export function createAgentRoutes(
  anthropic: Anthropic,
  mcpManager: McpClientManager,
  conversationManager: ConversationManager
): Router {
  const router = Router();
  const orchestrator = new OrchestratorAgent(anthropic);

  const agents: Record<string, InstanceType<typeof FinancialAdvisorAgent>> = {
    "financial-advisor": new FinancialAdvisorAgent(anthropic),
    "anomaly-detector": new AnomalyDetectorAgent(anthropic),
    "budget-optimizer": new BudgetOptimizerAgent(anthropic),
    forecaster: new ForecasterAgent(anthropic),
  };

  router.post("/chat", chatRateLimit, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        res.status(400).json({
          success: false,
          error: { code: "BAD_REQUEST", message: "message is required and must be a string" },
        });
        return;
      }

      const userId = req.userId!;
      const userToken = req.userToken!;

      const mcpClient = await mcpManager.createClient(userToken);
      const mcpTools = await mcpManager.listTools(mcpClient);
      const claudeTools = mcpToolsToClaudeTools(mcpTools);
      const history = conversationManager.getHistory(userId);
      const conversation = conversationManager.getOrCreate(userId);

      const result = await orchestrator.run(message, claudeTools, mcpClient, history);

      conversationManager.addMessage(userId, "user", message);
      conversationManager.addMessage(userId, "assistant", result.response);

      costTracker.trackUsage(
        userId,
        result.usage.inputTokens,
        result.usage.outputTokens,
        "claude-sonnet-4-20250514"
      );

      res.json({
        success: true,
        data: {
          response: result.response,
          agent: result.agent,
          conversationId: conversation.id,
          usage: result.usage,
        },
      });
    } catch (error) {
      logger.error({ error }, "Chat endpoint error");
      res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to process chat request" },
      });
    }
  });

  router.post("/insights", insightsRateLimit, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type } = req.body;
      const validTypes = Object.keys(INSIGHT_AGENT_MAP);
      if (!type || !validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: `type must be one of: ${validTypes.join(", ")}`,
          },
        });
        return;
      }

      const userId = req.userId!;
      const userToken = req.userToken!;
      const agentName = INSIGHT_AGENT_MAP[type];
      const prompt = INSIGHT_PROMPTS[type];

      const mcpClient = await mcpManager.createClient(userToken);
      const mcpTools = await mcpManager.listTools(mcpClient);
      const claudeTools = mcpToolsToClaudeTools(mcpTools);

      const agent = agents[agentName];
      const result = await agent.run(prompt, claudeTools, mcpClient, []);

      costTracker.trackUsage(
        userId,
        result.usage.inputTokens,
        result.usage.outputTokens,
        "claude-sonnet-4-20250514"
      );

      res.json({
        success: true,
        data: {
          response: result.response,
          agent: result.agent,
          conversationId: null,
          usage: result.usage,
        },
      });
    } catch (error) {
      logger.error({ error }, "Insights endpoint error");
      res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to generate insights" },
      });
    }
  });

  router.get(
    "/insights/summary",
    insightsRateLimit,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.userId!;
        const userToken = req.userToken!;

        const mcpClient = await mcpManager.createClient(userToken);
        const mcpTools = await mcpManager.listTools(mcpClient);
        const claudeTools = mcpToolsToClaudeTools(mcpTools);

        const agent = agents["financial-advisor"];
        const result = await agent.run(
          "Give me a brief financial summary: health score, top concern, and one actionable recommendation. Keep it under 200 words.",
          claudeTools,
          mcpClient,
          []
        );

        costTracker.trackUsage(
          userId,
          result.usage.inputTokens,
          result.usage.outputTokens,
          "claude-sonnet-4-20250514"
        );

        res.json({
          success: true,
          data: {
            response: result.response,
            agent: "financial-advisor",
            usage: result.usage,
          },
        });
      } catch (error) {
        logger.error({ error }, "Summary endpoint error");
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "Failed to generate summary" },
        });
      }
    }
  );

  router.delete("/conversations/:id", (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    conversationManager.clear(userId);
    res.json({ success: true, data: { message: "Conversation cleared" } });
  });

  return router;
}
