import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { BaseAgent, AgentResponse } from "./base-agent";
import { FinancialAdvisorAgent } from "./financial-advisor";
import { AnomalyDetectorAgent } from "./anomaly-detector";
import { BudgetOptimizerAgent } from "./budget-optimizer";
import { ForecasterAgent } from "./forecaster";
import { ClaudeTool } from "../mcp/tool-adapter";
import { logger } from "../utils/logger";

type Message = Anthropic.MessageParam;

interface RoutingDecision {
  agent: string;
  reason: string;
}

const MODEL = "claude-sonnet-4-20250514";

export class OrchestratorAgent extends BaseAgent {
  private agents: Map<string, BaseAgent>;

  constructor(anthropic: Anthropic) {
    super(anthropic, "orchestrator");

    this.agents = new Map<string, BaseAgent>([
      ["financial-advisor", new FinancialAdvisorAgent(anthropic)],
      ["anomaly-detector", new AnomalyDetectorAgent(anthropic)],
      ["budget-optimizer", new BudgetOptimizerAgent(anthropic)],
      ["forecaster", new ForecasterAgent(anthropic)],
    ]);
  }

  getSystemPrompt(): string {
    return this.loadPrompt("orchestrator.md");
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  async route(userMessage: string): Promise<RoutingDecision> {
    const response = await this.anthropic.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: this.getSystemPrompt(),
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";

    try {
      const parsed = JSON.parse(text.trim()) as RoutingDecision;
      if (parsed.agent && this.agents.has(parsed.agent)) {
        return parsed;
      }
    } catch {
      logger.warn({ text }, "Failed to parse routing decision, defaulting to financial-advisor");
    }

    return { agent: "financial-advisor", reason: "Default routing" };
  }

  async run(
    userMessage: string,
    tools: ClaudeTool[],
    mcpClient: Client,
    conversationHistory: Message[]
  ): Promise<AgentResponse> {
    const decision = await this.route(userMessage);
    logger.info({ decision }, "Routing to specialist agent");

    const agent = this.agents.get(decision.agent);
    if (!agent) {
      return {
        response: "Unable to determine the appropriate agent for your request.",
        agent: "orchestrator",
        toolCalls: [],
        usage: { inputTokens: 0, outputTokens: 0 },
      };
    }

    const result = await agent.run(
      userMessage,
      tools,
      mcpClient,
      conversationHistory
    );

    return {
      ...result,
      agent: decision.agent,
    };
  }
}
