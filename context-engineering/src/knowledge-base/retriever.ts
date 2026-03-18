import { KnowledgeGraph } from "../graph/knowledge-graph";
import { GraphTraversal } from "../graph/traversal";
import { GraphQueryEngine } from "../graph/query";
import { KnowledgeBase } from "./knowledge-base";
import { GraphNode, NodeType, EdgeType, NodeProperties } from "../graph/types";
import { KnowledgeEntry } from "./types";
import { logger } from "../utils/logger";

export interface RetrievalResult {
  graphContext: {
    relevantNodes: GraphNode[];
    relationships: string[]; // Human-readable relationship descriptions
    summary: string;
  };
  knowledgeContext: {
    entries: KnowledgeEntry[];
    relevantRules: string[];
  };
  combinedContext: string; // Formatted context string ready for LLM
  metadata: {
    retrievalTimeMs: number;
    graphNodesScanned: number;
    knowledgeEntriesScanned: number;
    totalTokenEstimate: number;
  };
}

export interface RetrievalOptions {
  maxGraphNodes?: number;
  maxKnowledgeEntries?: number;
  maxTokens?: number;
  includeRules?: boolean;
  focusNodeTypes?: NodeType[];
  userQuery?: string;
}

/**
 * Combines graph traversal and knowledge base search to produce
 * rich, context-aware retrieval results for LLM consumption.
 */
export class ContextRetriever {
  private graph: KnowledgeGraph;
  private knowledgeBase: KnowledgeBase;
  private traversal: GraphTraversal;
  private queryEngine: GraphQueryEngine;

  constructor(graph: KnowledgeGraph, knowledgeBase: KnowledgeBase) {
    this.graph = graph;
    this.knowledgeBase = knowledgeBase;
    this.traversal = new GraphTraversal(graph);
    this.queryEngine = new GraphQueryEngine(graph);
  }

  /**
   * Main retrieval method - combines graph traversal + KB search
   */
  retrieve(userId: string, intent: string, options?: RetrievalOptions): RetrievalResult {
    const startTime = Date.now();
    const maxGraphNodes = options?.maxGraphNodes ?? 30;
    const maxKnowledgeEntries = options?.maxKnowledgeEntries ?? 5;
    const maxTokens = options?.maxTokens ?? 4000;
    const includeRules = options?.includeRules ?? true;

    // Determine which intent-based retrieval to use
    const intentLower = intent.toLowerCase();
    let graphResult;

    if (intentLower.includes("budget") || intentLower.includes("spending limit")) {
      graphResult = this.queryEngine.getBudgetContext(userId);
    } else if (
      intentLower.includes("spend") ||
      intentLower.includes("expense") ||
      intentLower.includes("purchase")
    ) {
      graphResult = this.queryEngine.getSpendingContext(userId);
    } else if (
      intentLower.includes("goal") ||
      intentLower.includes("saving") ||
      intentLower.includes("target")
    ) {
      graphResult = this.queryEngine.getGoalContext(userId);
    } else if (
      intentLower.includes("anomal") ||
      intentLower.includes("unusual") ||
      intentLower.includes("fraud")
    ) {
      graphResult = this.queryEngine.getAnomalyContext(userId);
    } else if (
      intentLower.includes("account") ||
      intentLower.includes("balance") ||
      intentLower.includes("overview")
    ) {
      graphResult = this.queryEngine.getAccountOverview(userId);
    } else {
      graphResult = this.queryEngine.getFullFinancialContext(userId);
    }

    // Limit graph nodes
    const relevantNodes = graphResult.nodes.slice(0, maxGraphNodes);

    // Build human-readable relationship descriptions
    const relationships = this.buildRelationshipDescriptions(relevantNodes, graphResult.edges);

    // Build graph summary
    const graphSummary = this.formatGraphContext(relevantNodes, this.graph);

    // Search knowledge base using the intent
    const searchQuery = options?.userQuery ?? intent;
    const kbResults = this.knowledgeBase.search(searchQuery, {
      limit: maxKnowledgeEntries,
    });
    const kbEntries = kbResults.map((r) => r.entry);

    const relevantRules = includeRules ? kbEntries.map((e) => `${e.title}: ${e.content}`) : [];

    // Combine context
    const combinedParts: string[] = [];

    if (graphSummary.length > 0) {
      combinedParts.push("## Financial Data Context\n" + graphSummary);
    }

    if (relationships.length > 0) {
      combinedParts.push("## Key Relationships\n" + relationships.join("\n"));
    }

    if (relevantRules.length > 0) {
      combinedParts.push(
        "## Relevant Financial Knowledge\n" + relevantRules.map((r) => `- ${r}`).join("\n")
      );
    }

    let combinedContext = combinedParts.join("\n\n");

    // Trim to token budget
    combinedContext = this.trimToTokenBudget(combinedContext, maxTokens);

    const result: RetrievalResult = {
      graphContext: {
        relevantNodes,
        relationships,
        summary: graphSummary,
      },
      knowledgeContext: {
        entries: kbEntries,
        relevantRules,
      },
      combinedContext,
      metadata: {
        retrievalTimeMs: Date.now() - startTime,
        graphNodesScanned: graphResult.nodes.length,
        knowledgeEntriesScanned: this.knowledgeBase.size,
        totalTokenEstimate: this.estimateTokens(combinedContext),
      },
    };

    logger.debug(
      {
        userId,
        intent,
        graphNodes: relevantNodes.length,
        kbEntries: kbEntries.length,
        tokenEstimate: result.metadata.totalTokenEstimate,
        timeMs: result.metadata.retrievalTimeMs,
      },
      "Context retrieval completed"
    );

    return result;
  }

  /**
   * Specialized retriever for financial advice queries
   */
  retrieveForFinancialAdvice(userId: string, query: string): RetrievalResult {
    return this.retrieve(userId, query, {
      maxGraphNodes: 40,
      maxKnowledgeEntries: 8,
      maxTokens: 5000,
      includeRules: true,
      userQuery: query,
    });
  }

  /**
   * Specialized retriever for anomaly detection
   */
  retrieveForAnomalyDetection(userId: string): RetrievalResult {
    return this.retrieve(userId, "anomaly detection unusual spending", {
      maxGraphNodes: 50,
      maxKnowledgeEntries: 3,
      maxTokens: 4000,
      includeRules: false,
      focusNodeTypes: [NodeType.Transaction, NodeType.Merchant],
    });
  }

  /**
   * Specialized retriever for budget optimization
   */
  retrieveForBudgetOptimization(userId: string): RetrievalResult {
    return this.retrieve(userId, "budget optimization spending limits", {
      maxGraphNodes: 35,
      maxKnowledgeEntries: 6,
      maxTokens: 4500,
      includeRules: true,
      focusNodeTypes: [NodeType.Budget, NodeType.Category],
    });
  }

  /**
   * Specialized retriever for forecasting
   */
  retrieveForForecasting(userId: string): RetrievalResult {
    return this.retrieve(userId, "forecast future spending savings goals", {
      maxGraphNodes: 40,
      maxKnowledgeEntries: 4,
      maxTokens: 4500,
      includeRules: true,
      focusNodeTypes: [
        NodeType.Transaction,
        NodeType.Goal,
        NodeType.TimePeriod,
        NodeType.RecurringPayment,
      ],
    });
  }

  /**
   * Format graph nodes into readable text for LLM consumption
   */
  formatGraphContext(nodes: GraphNode[], graph: KnowledgeGraph): string {
    if (nodes.length === 0) return "";

    const sections: string[] = [];

    // Group nodes by type
    const grouped = new Map<NodeType, GraphNode[]>();
    for (const node of nodes) {
      if (!grouped.has(node.type)) {
        grouped.set(node.type, []);
      }
      grouped.get(node.type)!.push(node);
    }

    // Format accounts
    const accounts = grouped.get(NodeType.Account);
    if (accounts && accounts.length > 0) {
      const lines = accounts.map((a) => {
        const p = a.properties as NodeProperties[NodeType.Account];
        return `  - ${p.name} (${p.accountType}): $${p.balance.toFixed(2)} ${p.currency}${p.isArchived ? " [archived]" : ""}`;
      });
      sections.push("Accounts:\n" + lines.join("\n"));
    }

    // Format budgets
    const budgets = grouped.get(NodeType.Budget);
    if (budgets && budgets.length > 0) {
      const lines = budgets.map((b) => {
        const p = b.properties as NodeProperties[NodeType.Budget];
        return `  - ${p.name}: $${p.spent.toFixed(2)}/$${p.amount.toFixed(2)} (${p.utilizationPercent}% used, ${p.period})`;
      });
      sections.push("Budgets:\n" + lines.join("\n"));
    }

    // Format goals
    const goals = grouped.get(NodeType.Goal);
    if (goals && goals.length > 0) {
      const lines = goals.map((g) => {
        const p = g.properties as NodeProperties[NodeType.Goal];
        return `  - ${p.name}: $${p.currentAmount.toFixed(2)}/$${p.targetAmount.toFixed(2)} (${p.progressPercent}% complete)${p.deadline ? `, deadline: ${p.deadline}` : ""}`;
      });
      sections.push("Goals:\n" + lines.join("\n"));
    }

    // Format user profile
    const profiles = grouped.get(NodeType.UserProfile);
    if (profiles && profiles.length > 0) {
      const p = profiles[0].properties as NodeProperties[NodeType.UserProfile];
      sections.push(
        `User Profile:\n  - Monthly income: $${p.monthlyIncome.toFixed(2)}\n  - Monthly expenses: $${p.monthlyExpenses.toFixed(2)}\n  - Savings rate: ${p.savingsRate}%`
      );
    }

    // Format categories with spending
    const categories = grouped.get(NodeType.Category);
    if (categories && categories.length > 0) {
      const withSpending = categories.filter((c) => {
        const p = c.properties as NodeProperties[NodeType.Category];
        return p.totalSpent > 0;
      });
      if (withSpending.length > 0) {
        const lines = withSpending.map((c) => {
          const p = c.properties as NodeProperties[NodeType.Category];
          return `  - ${p.name}: ${p.transactionCount} transactions, $${p.totalSpent.toFixed(2)} total`;
        });
        sections.push("Spending by Category:\n" + lines.join("\n"));
      }
    }

    // Format insights
    const insights = grouped.get(NodeType.Insight);
    if (insights && insights.length > 0) {
      const lines = insights.map((i) => {
        const p = i.properties as NodeProperties[NodeType.Insight];
        return `  - [${p.insightType}] ${p.title}: ${p.description}`;
      });
      sections.push("Insights:\n" + lines.join("\n"));
    }

    // Format recurring payments
    const recurring = grouped.get(NodeType.RecurringPayment);
    if (recurring && recurring.length > 0) {
      const lines = recurring.map((r) => {
        const p = r.properties as NodeProperties[NodeType.RecurringPayment];
        return `  - ${p.name}: $${p.amount.toFixed(2)} (${p.frequency})${p.isActive ? "" : " [inactive]"}`;
      });
      sections.push("Recurring Payments:\n" + lines.join("\n"));
    }

    // Format merchants
    const merchants = grouped.get(NodeType.Merchant);
    if (merchants && merchants.length > 0) {
      const sorted = [...merchants].sort((a, b) => {
        const pa = a.properties as NodeProperties[NodeType.Merchant];
        const pb = b.properties as NodeProperties[NodeType.Merchant];
        return pb.totalSpent - pa.totalSpent;
      });
      const top = sorted.slice(0, 10);
      const lines = top.map((m) => {
        const p = m.properties as NodeProperties[NodeType.Merchant];
        return `  - ${p.name}: ${p.transactionCount} transactions, $${p.totalSpent.toFixed(2)} total (avg $${p.averageTransaction.toFixed(2)})`;
      });
      sections.push("Top Merchants:\n" + lines.join("\n"));
    }

    return sections.join("\n\n");
  }

  /**
   * Estimate token count (rough: chars/4)
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Trim context to fit token budget
   */
  trimToTokenBudget(context: string, maxTokens: number): string {
    const currentTokens = this.estimateTokens(context);
    if (currentTokens <= maxTokens) return context;

    // Trim by removing content from the end, preserving section headers
    const maxChars = maxTokens * 4;
    let trimmed = context.substring(0, maxChars);

    // Try to end at a complete line
    const lastNewline = trimmed.lastIndexOf("\n");
    if (lastNewline > maxChars * 0.8) {
      trimmed = trimmed.substring(0, lastNewline);
    }

    return trimmed + "\n\n[Context trimmed to fit token budget]";
  }

  /**
   * Build human-readable relationship descriptions from edges
   */
  private buildRelationshipDescriptions(
    nodes: GraphNode[],
    edges: Array<{
      source: string;
      target: string;
      type: EdgeType;
      properties: { label?: string; description?: string };
    }>
  ): string[] {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const descriptions: string[] = [];

    for (const edge of edges) {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      if (!sourceNode || !targetNode) continue;

      const description =
        edge.properties.description ??
        `${sourceNode.label} ${edge.properties.label ?? edge.type} ${targetNode.label}`;
      descriptions.push(`- ${description}`);
    }

    return descriptions.slice(0, 20); // Limit relationship descriptions
  }
}
