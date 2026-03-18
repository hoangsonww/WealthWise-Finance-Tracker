import {
  KnowledgeGraph,
  KnowledgeBase,
  ContextEngine,
  IngestionPipeline,
  getFinancialKnowledgeEntries,
  ContextWindow,
  KnowledgeEntry,
} from "@wealthwise/context-engineering";
import { logger } from "../utils/logger";

interface ContextIntegrationConfig {
  mongoUri: string;
  maxTotalTokens?: number;
  refreshIntervalMs?: number; // default 5 minutes
}

export class ContextIntegration {
  private engine: ContextEngine | null = null;
  private pipeline: IngestionPipeline | null = null;
  private graph: KnowledgeGraph;
  private knowledgeBase: KnowledgeBase;
  private userGraphs: Map<
    string,
    { graph: KnowledgeGraph; engine: ContextEngine; lastRefresh: number }
  > = new Map();
  private config: ContextIntegrationConfig;
  private refreshIntervalMs: number;

  constructor(config: ContextIntegrationConfig) {
    this.config = config;
    this.graph = new KnowledgeGraph();
    this.knowledgeBase = new KnowledgeBase();
    this.refreshIntervalMs = config.refreshIntervalMs ?? 5 * 60 * 1000;
  }

  /**
   * Initialize: load knowledge base with financial entries.
   */
  async initialize(): Promise<void> {
    const entries = getFinancialKnowledgeEntries();
    entries.forEach((e: KnowledgeEntry) => this.knowledgeBase.addEntry(e));
    logger.info({ entries: entries.length }, "Knowledge base loaded");
  }

  /**
   * Get or create a context engine for a specific user.
   * Ingests user data if not cached or if stale.
   */
  async getContextForUser(userId: string): Promise<ContextEngine> {
    const cached = this.userGraphs.get(userId);
    if (cached && Date.now() - cached.lastRefresh < this.refreshIntervalMs) {
      return cached.engine;
    }

    // Ingest fresh data for this user
    const pipeline = new IngestionPipeline(this.config.mongoUri);
    const { graph } = await pipeline.ingest(userId);
    await pipeline.disconnect();

    const engine = new ContextEngine(graph, this.knowledgeBase, {
      maxTotalTokens: this.config.maxTotalTokens ?? 8000,
    });

    this.userGraphs.set(userId, {
      graph,
      engine,
      lastRefresh: Date.now(),
    });
    logger.info(
      { userId, nodes: graph.nodeCount, edges: graph.edgeCount },
      "User context refreshed"
    );

    return engine;
  }

  /**
   * Assemble context for an agent request.
   */
  async assembleContext(params: {
    userId: string;
    agentType: string;
    userMessage: string;
    conversationHistory?: Array<{ role: string; content: string }>;
  }): Promise<ContextWindow> {
    const engine = await this.getContextForUser(params.userId);
    return engine.assembleContext(params);
  }

  /**
   * Invalidate cached context for a user (call after data changes).
   */
  invalidateUser(userId: string): void {
    this.userGraphs.delete(userId);
  }

  /**
   * Cleanup all cached data.
   */
  async shutdown(): Promise<void> {
    this.userGraphs.clear();
  }
}

// Singleton
let instance: ContextIntegration | null = null;

export function getContextIntegration(): ContextIntegration | null {
  return instance;
}

export function initContextIntegration(config: ContextIntegrationConfig): ContextIntegration {
  instance = new ContextIntegration(config);
  return instance;
}
