import { KnowledgeGraph } from "../graph/knowledge-graph";
import { KnowledgeBase } from "../knowledge-base/knowledge-base";
import { ContextRetriever } from "../knowledge-base/retriever";
import { ContextWindow, ContextConfig, ContextComponent } from "./types";
import { logger } from "../utils/logger";

const DEFAULT_CONFIG: ContextConfig = {
  maxTotalTokens: 8000,
  systemTokenBudget: 2000,
  graphTokenBudget: 2500,
  knowledgeTokenBudget: 1500,
  conversationTokenBudget: 1500,
  userTokenBudget: 500,
};

export class ContextEngine {
  private graph: KnowledgeGraph;
  private knowledgeBase: KnowledgeBase;
  private retriever: ContextRetriever;
  private config: ContextConfig;

  constructor(
    graph: KnowledgeGraph,
    knowledgeBase: KnowledgeBase,
    config?: Partial<ContextConfig>
  ) {
    this.graph = graph;
    this.knowledgeBase = knowledgeBase;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.retriever = new ContextRetriever(graph, knowledgeBase);
  }

  /**
   * Assemble a complete context window for an agent.
   */
  assembleContext(params: {
    userId: string;
    agentType: string;
    userMessage: string;
    conversationHistory?: Array<{ role: string; content: string }>;
    additionalContext?: string;
  }): ContextWindow {
    const startTime = Date.now();
    const truncations: string[] = [];

    // 1. System context (agent-specific instructions)
    const systemRaw = this.getAgentSystemContext(params.agentType);
    const systemComponent: ContextComponent = {
      name: "system",
      content: systemRaw,
      tokenCount: this.estimateTokens(systemRaw),
      priority: 10,
      source: "agent-system-prompt",
    };

    // 2. Graph context (financial data)
    const retrievalResult = this.retriever.retrieve(params.userId, params.userMessage, {
      maxGraphNodes: 40,
      maxKnowledgeEntries: 6,
      maxTokens: this.config.graphTokenBudget,
      userQuery: params.userMessage,
    });

    const graphComponent: ContextComponent = {
      name: "graph",
      content: retrievalResult.graphContext.summary,
      tokenCount: this.estimateTokens(retrievalResult.graphContext.summary),
      priority: 8,
      source: "knowledge-graph",
    };

    // 3. Knowledge base context (financial rules/tips)
    const knowledgeText = retrievalResult.knowledgeContext.relevantRules
      .map((r) => `- ${r}`)
      .join("\n");
    const knowledgeComponent: ContextComponent = {
      name: "knowledge",
      content: knowledgeText,
      tokenCount: this.estimateTokens(knowledgeText),
      priority: 6,
      source: "knowledge-base",
    };

    // 4. Conversation history
    let conversationText = "";
    if (params.conversationHistory && params.conversationHistory.length > 0) {
      conversationText = params.conversationHistory
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");
    }
    const conversationComponent: ContextComponent = {
      name: "conversation",
      content: conversationText,
      tokenCount: this.estimateTokens(conversationText),
      priority: 7,
      source: "conversation-history",
    };

    // 5. User context (additional context / user message)
    const userText = params.additionalContext
      ? `${params.userMessage}\n\nAdditional context: ${params.additionalContext}`
      : params.userMessage;
    const userComponent: ContextComponent = {
      name: "user",
      content: userText,
      tokenCount: this.estimateTokens(userText),
      priority: 9,
      source: "user-input",
    };

    // Fit all components into budget
    const allComponents = [
      systemComponent,
      userComponent,
      graphComponent,
      conversationComponent,
      knowledgeComponent,
    ];

    const fittedComponents = this.fitToBudget(allComponents, this.config.maxTotalTokens);

    // Check for truncations
    for (let i = 0; i < allComponents.length; i++) {
      const original = allComponents[i];
      const fitted = fittedComponents.find((c) => c.name === original.name);
      if (fitted && fitted.tokenCount < original.tokenCount) {
        truncations.push(
          `${original.name}: trimmed from ${original.tokenCount} to ${fitted.tokenCount} tokens`
        );
      }
      if (!fitted) {
        truncations.push(`${original.name}: removed entirely`);
      }
    }

    // Build the final ContextWindow
    const findContent = (name: string): string => {
      const component = fittedComponents.find((c) => c.name === name);
      return component?.content ?? "";
    };

    const totalTokens = fittedComponents.reduce((sum, c) => sum + c.tokenCount, 0);

    const window: ContextWindow = {
      systemContext: findContent("system"),
      userContext: findContent("user"),
      graphContext: findContent("graph"),
      knowledgeContext: findContent("knowledge"),
      conversationContext: findContent("conversation"),
      totalTokens,
      tokenBudget: this.config.maxTotalTokens,
      metadata: {
        assembledAt: new Date().toISOString(),
        components: fittedComponents,
        truncations,
      },
    };

    logger.debug(
      {
        userId: params.userId,
        agentType: params.agentType,
        totalTokens,
        budget: this.config.maxTotalTokens,
        components: fittedComponents.length,
        truncations: truncations.length,
        timeMs: Date.now() - startTime,
      },
      "Context window assembled"
    );

    return window;
  }

  /**
   * Update an existing context window with new information.
   */
  updateContext(window: ContextWindow, newInfo: string): ContextWindow {
    const newInfoTokens = this.estimateTokens(newInfo);
    const updatedUserContext = window.userContext
      ? `${window.userContext}\n\n[Update]: ${newInfo}`
      : newInfo;

    const updatedTokens =
      window.totalTokens -
      this.estimateTokens(window.userContext) +
      this.estimateTokens(updatedUserContext);

    // If the update pushes us over budget, trim the graph context
    let graphContext = window.graphContext;
    let graphTokens = this.estimateTokens(graphContext);

    if (updatedTokens > window.tokenBudget) {
      const excess = updatedTokens - window.tokenBudget;
      const newGraphMaxChars = Math.max(0, (graphTokens - excess) * 4);
      graphContext = graphContext.substring(0, newGraphMaxChars);
      graphTokens = this.estimateTokens(graphContext);
    }

    const finalTotalTokens =
      this.estimateTokens(window.systemContext) +
      this.estimateTokens(updatedUserContext) +
      graphTokens +
      this.estimateTokens(window.knowledgeContext) +
      this.estimateTokens(window.conversationContext);

    return {
      ...window,
      userContext: updatedUserContext,
      graphContext,
      totalTokens: finalTotalTokens,
      metadata: {
        ...window.metadata,
        assembledAt: new Date().toISOString(),
        truncations: [
          ...window.metadata.truncations,
          `Updated with ${newInfoTokens} tokens of new information`,
        ],
      },
    };
  }

  /**
   * Get agent-specific system context/instructions.
   */
  private getAgentSystemContext(agentType: string): string {
    const baseContext =
      "You are a WealthWise AI financial assistant. You provide personalized financial advice based on the user's actual financial data.\n\n";

    const agentContexts: Record<string, string> = {
      "financial-advisor": `${baseContext}As a Financial Advisor agent, your role is to:
- Analyze the user's financial data to provide actionable advice
- Consider their income, expenses, savings rate, and financial goals
- Reference specific numbers from their accounts and transactions
- Suggest concrete steps to improve their financial health
- Be encouraging but honest about areas needing improvement
- Always explain the reasoning behind your recommendations
- Consider both short-term actions and long-term strategy`,

      "budget-optimizer": `${baseContext}As a Budget Optimizer agent, your role is to:
- Analyze spending patterns across categories
- Identify categories where spending exceeds budgets
- Suggest realistic budget adjustments based on actual spending history
- Highlight recurring expenses that could be reduced
- Compare spending trends month-over-month
- Propose specific dollar amounts for budget adjustments
- Prioritize changes with the highest impact-to-effort ratio`,

      "anomaly-detector": `${baseContext}As an Anomaly Detection agent, your role is to:
- Identify unusual transactions that deviate from normal patterns
- Flag transactions that are significantly above the user's average
- Detect potential duplicate charges
- Note new merchants or categories that appear suddenly
- Assess whether flagged items are genuine concerns or expected variations
- Provide clear explanations for why each item was flagged
- Suggest follow-up actions for suspicious activity`,

      "goal-tracker": `${baseContext}As a Goal Tracker agent, your role is to:
- Monitor progress toward each financial goal
- Calculate required monthly contributions to meet deadlines
- Identify goals at risk of not being met on time
- Suggest strategies to accelerate goal completion
- Connect savings account balances to goal funding
- Celebrate milestones and progress
- Provide realistic timeline adjustments when needed`,

      forecaster: `${baseContext}As a Financial Forecaster agent, your role is to:
- Project future account balances based on current trends
- Estimate monthly spending based on historical patterns and recurring payments
- Model different scenarios (optimistic, realistic, pessimistic)
- Predict when goals will be reached at current contribution rates
- Identify upcoming large expenses from recurring payment schedules
- Warn about potential cash flow issues
- Suggest timing for major financial decisions`,

      general: `${baseContext}You help users understand and improve their finances by:
- Answering questions about their financial data
- Providing context-aware financial advice
- Explaining financial concepts in simple terms
- Referencing their actual data when making suggestions
- Being proactive about financial health concerns`,
    };

    return agentContexts[agentType] ?? agentContexts["general"];
  }

  /**
   * Prioritize and trim components to fit the total token budget.
   * Components are sorted by priority (highest first).
   * Each component is trimmed proportionally if total exceeds budget.
   */
  private fitToBudget(components: ContextComponent[], budget: number): ContextComponent[] {
    // Sort by priority descending
    const sorted = [...components].sort((a, b) => b.priority - a.priority);

    const totalTokens = sorted.reduce((sum, c) => sum + c.tokenCount, 0);

    if (totalTokens <= budget) {
      return sorted;
    }

    // Need to trim. Allocate proportional to priority.
    const totalPriority = sorted.reduce((sum, c) => sum + c.priority, 0);
    const result: ContextComponent[] = [];
    let remainingBudget = budget;

    for (let i = 0; i < sorted.length; i++) {
      const component = sorted[i];

      if (remainingBudget <= 0) {
        // Skip this component entirely
        continue;
      }

      // Allocate budget proportional to priority
      const priorityShare = component.priority / totalPriority;
      const maxTokens = Math.floor(budget * priorityShare);
      const allocated = Math.min(component.tokenCount, maxTokens, remainingBudget);

      if (allocated <= 0) continue;

      if (allocated < component.tokenCount) {
        // Need to trim content
        const maxChars = allocated * 4;
        let trimmedContent = component.content.substring(0, maxChars);

        // Try to end at a newline
        const lastNewline = trimmedContent.lastIndexOf("\n");
        if (lastNewline > maxChars * 0.7) {
          trimmedContent = trimmedContent.substring(0, lastNewline);
        }

        result.push({
          ...component,
          content: trimmedContent,
          tokenCount: this.estimateTokens(trimmedContent),
        });
      } else {
        result.push(component);
      }

      remainingBudget -= allocated;
    }

    return result;
  }

  /**
   * Estimate tokens for text (rough: chars/4)
   */
  estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }
}
